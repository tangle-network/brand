import { render, screen, waitFor } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Doc } from "yjs";
import type * as EditorPeers from "./editor-peers";
import { createEditorProvider } from "./editor-provider";
import { createTiptapEditor } from "./tiptap-editor";

class ErrorTrap extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    return this.state.message ?? this.props.children;
  }
}

class StubHocuspocusProvider {
  static instances: StubHocuspocusProvider[] = [];

  awareness = {
    clientID: 1,
    getStates: () => new Map(),
    getLocalState: () => ({}),
    setLocalStateField: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
  destroy = vi.fn();

  constructor(readonly options: { document: Doc }) {
    StubHocuspocusProvider.instances.push(this);
  }
}

/** A tiptap extension records what the editor configured it with. */
function stubExtension(name: string) {
  const calls: Record<string, unknown>[] = [];
  return {
    calls,
    default: {
      configure(options: Record<string, unknown>) {
        calls.push(options);
        return { name, options };
      },
    },
  };
}

/**
 * Only the members the collaborative editor calls. yjs is the real package,
 * because the provider and the editor must agree on one document.
 */
function collaborationStubs() {
  const starterKit = stubExtension("starterKit");
  const collaboration = stubExtension("collaboration");
  const collaborationCaret = stubExtension("collaborationCaret");
  const editorOptions: Record<string, unknown>[] = [];
  const editor = {
    setEditable: vi.fn(),
    isEmpty: true,
    commands: { setContent: vi.fn() },
  };

  const peers = {
    react: {
      useEditor: (options: Record<string, unknown>) => {
        editorOptions.push(options);
        return editor;
      },
      EditorContent: () => <div data-testid="editor-content" />,
    },
    starterKit,
    collaboration,
    collaborationCaret,
    hocuspocus: { HocuspocusProvider: StubHocuspocusProvider },
    yjs: { Doc },
  } as unknown as EditorPeers.CollaborationPeers;

  return { peers, starterKit, collaboration, collaborationCaret, editorOptions, editor };
}

function renderCollaborativeEditor(stubs: ReturnType<typeof collaborationStubs>) {
  const EditorProvider = createEditorProvider(stubs.peers);
  const TiptapEditor = createTiptapEditor(stubs.peers);
  return render(
    <EditorProvider
      websocketUrl="wss://collab.example/ws"
      documentName="doc:readme"
      token="jwt"
      user={{ name: "Ada" }}
    >
      <TiptapEditor />
    </EditorProvider>,
  );
}

afterEach(() => {
  StubHocuspocusProvider.instances = [];
  vi.doUnmock("./editor-peers");
  vi.resetModules();
});

describe("createTiptapEditor", () => {
  it("renders the editor surface from the loaded namespaces", () => {
    renderCollaborativeEditor(collaborationStubs());

    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("gives Collaboration the document fragment the provider shares", () => {
    const stubs = collaborationStubs();
    renderCollaborativeEditor(stubs);

    const [provider] = StubHocuspocusProvider.instances;
    // The extensions rebuild once the transport arrives, so read the last
    // configuration: the transport and the editor must bind to one Y.Doc, or
    // remote edits never reach the surface.
    expect(stubs.collaboration.calls.at(-1)?.fragment).toBe(
      provider.options.document.getXmlFragment("prosemirror"),
    );
  });

  it("gives CollaborationCaret the provider and a named user", () => {
    const stubs = collaborationStubs();
    renderCollaborativeEditor(stubs);

    const [provider] = StubHocuspocusProvider.instances;
    // The caret joins only once the provider carries awareness.
    expect(stubs.collaborationCaret.calls).toHaveLength(1);
    const [caretOptions] = stubs.collaborationCaret.calls;
    expect(caretOptions.provider).toBe(provider);
    // The stub awareness carries no local user yet, so the editor names the
    // fallback rather than passing undefined into the caret renderer.
    expect(caretOptions.user).toEqual({ name: "Anonymous", color: "#808080" });
  });

  it("passes every configured extension to the editor", () => {
    const stubs = collaborationStubs();
    renderCollaborativeEditor(stubs);

    expect(stubs.starterKit.calls.at(-1)).toMatchObject({ history: false });
    const options = stubs.editorOptions.at(-1);
    expect(
      (options?.extensions as { name: string }[]).map((one) => one.name),
    ).toEqual(["starterKit", "collaboration", "collaborationCaret"]);
  });
});

describe("TiptapEditor", () => {
  it("holds a placeholder while the peers are still loading", async () => {
    let releasePeers: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      releasePeers = resolve;
    });
    const stubs = collaborationStubs();
    vi.resetModules();
    vi.doMock("./editor-peers", async () => ({
      ...(await vi.importActual<typeof EditorPeers>("./editor-peers")),
      loadCollaborationPeers: async () => {
        await gate;
        return stubs.peers;
      },
    }));
    const { TiptapEditor } = await import("./tiptap-editor");
    // Both modules come from the reset graph, so the provider and the editor
    // share one EditorContext. A provider built from the loaded peers
    // directly, because the exported EditorProvider waits on the same gate and
    // would render nothing at all.
    const freshProvider = await import("./editor-provider");
    const ResolvedProvider = freshProvider.createEditorProvider(stubs.peers);

    render(
      <ResolvedProvider
        websocketUrl="wss://collab.example/ws"
        documentName="doc:readme"
        token="jwt"
        user={{ name: "Ada" }}
      >
        <TiptapEditor />
      </ResolvedProvider>,
    );

    expect(screen.getByText("Loading editor…")).toBeInTheDocument();
    expect(screen.queryByTestId("editor-content")).toBeNull();

    releasePeers?.();

    await waitFor(() => {
      expect(screen.getByTestId("editor-content")).toBeInTheDocument();
    });
    expect(screen.queryByText("Loading editor…")).toBeNull();
  });

  it("fails with the install list when the collaboration peers cannot be loaded", async () => {
    const missing =
      "@tangle-network/ui/editor needs its optional collaboration peers. Install yjs.";
    vi.resetModules();
    vi.doMock("./editor-peers", async () => {
      const actual = await vi.importActual<typeof EditorPeers>("./editor-peers");
      return {
        ...actual,
        loadCollaborationPeers: async () => {
          throw new actual.MissingEditorPeersError(missing);
        },
      };
    });
    const { TiptapEditor } = await import("./tiptap-editor");

    // The wrapper reaches its loader before it reads the editor context, so
    // the install list surfaces without a provider around it.
    render(
      <ErrorTrap>
        <TiptapEditor />
      </ErrorTrap>,
    );

    await waitFor(() => {
      expect(screen.getByText(missing)).toBeInTheDocument();
    });
  });
});
