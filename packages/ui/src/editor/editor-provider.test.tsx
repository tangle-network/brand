import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Doc } from "yjs";
import { createEditorProvider, useEditorContext } from "./editor-provider";
import type * as EditorPeers from "./editor-peers";
import type { EditorProviderPeers } from "./editor-peers";
import { useEditorConnection } from "./use-editor";

interface ProviderOptions {
  url: string;
  name: string;
  document: Doc;
  onConnect: () => void;
  onDisconnect: () => void;
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

  constructor(readonly options: ProviderOptions) {
    StubHocuspocusProvider.instances.push(this);
  }
}

/** Only the members the provider reads; yjs is the real package. */
function stubPeers() {
  return {
    yjs: { Doc },
    hocuspocus: { HocuspocusProvider: StubHocuspocusProvider },
  } as unknown as EditorProviderPeers;
}

function ConnectionProbe() {
  // Reads the context through the public hook, not through the provider
  // module, so a context created per factory call would leave it unresolved.
  const { state, isConnected } = useEditorConnection();
  const { doc } = useEditorContext();
  return (
    <span data-testid="probe" data-fragment={doc.getXmlFragment("prosemirror").length}>
      {state}
      {isConnected ? " (live)" : ""}
    </span>
  );
}

afterEach(() => {
  StubHocuspocusProvider.instances = [];
  vi.doUnmock("./editor-peers");
  vi.resetModules();
});

describe("createEditorProvider", () => {
  it("builds the document and the transport from the loaded peers", () => {
    const EditorProvider = createEditorProvider(stubPeers());

    render(
      <EditorProvider
        websocketUrl="wss://collab.example/ws"
        documentName="doc:readme"
        token="jwt"
        user={{ name: "Ada" }}
      >
        <ConnectionProbe />
      </EditorProvider>,
    );

    expect(StubHocuspocusProvider.instances).toHaveLength(1);
    const [provider] = StubHocuspocusProvider.instances;
    expect(provider.options.url).toBe("wss://collab.example/ws");
    expect(provider.options.name).toBe("doc:readme");
    // The Y.Doc came from `peers.yjs.Doc`, and the editor asks it for this
    // fragment, so the transport and the editor must share the one instance.
    expect(provider.options.document).toBeInstanceOf(Doc);
    expect(provider.awareness.setLocalStateField).toHaveBeenCalledWith(
      "user",
      expect.objectContaining({ name: "Ada" }),
    );
  });

  it("serves the connection state to hooks that read the shared context", async () => {
    const EditorProvider = createEditorProvider(stubPeers());
    const onConnectionChange = vi.fn();

    render(
      <EditorProvider
        websocketUrl="wss://collab.example/ws"
        documentName="doc:readme"
        token="jwt"
        user={{ name: "Ada" }}
        onConnectionChange={onConnectionChange}
      >
        <ConnectionProbe />
      </EditorProvider>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent("connecting");

    const [provider] = StubHocuspocusProvider.instances;
    act(() => {
      provider.options.onConnect();
    });

    await waitFor(() => {
      expect(screen.getByTestId("probe")).toHaveTextContent("connected (live)");
    });
    expect(onConnectionChange).toHaveBeenCalledWith("connected");
  });

  it("destroys the transport when it unmounts", () => {
    const EditorProvider = createEditorProvider(stubPeers());

    const { unmount } = render(
      <EditorProvider
        websocketUrl="wss://collab.example/ws"
        documentName="doc:readme"
        token="jwt"
        user={{ name: "Ada" }}
      >
        <ConnectionProbe />
      </EditorProvider>,
    );

    const [provider] = StubHocuspocusProvider.instances;
    unmount();

    expect(provider.destroy).toHaveBeenCalledTimes(1);
  });
});

describe("EditorProvider", () => {
  it("renders with no tiptap package installed", async () => {
    // The provider builds the document and the socket from yjs and Hocuspocus
    // alone. A consumer that drives its own editor from this context installs
    // those two and nothing else, so reaching for a tiptap namespace here
    // would break that consumer's build-clean install.
    const tiptapSpecifiers = [
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-collaboration",
      "@tiptap/extension-collaboration-caret",
    ];
    vi.resetModules();
    for (const specifier of tiptapSpecifiers) {
      vi.doMock(specifier, () => {
        throw new Error(`Could not resolve "${specifier}"`);
      });
    }
    vi.doMock("yjs", () => ({ Doc }));
    vi.doMock("@hocuspocus/provider", () => ({
      HocuspocusProvider: StubHocuspocusProvider,
    }));
    const { EditorProvider } = await import("./editor-provider");

    render(
      <EditorProvider
        websocketUrl="wss://collab.example/ws"
        documentName="doc:readme"
        token="jwt"
        user={{ name: "Ada" }}
      >
        <span data-testid="child">custom editor surface</span>
      </EditorProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(StubHocuspocusProvider.instances).toHaveLength(1);

    for (const specifier of [...tiptapSpecifiers, "yjs", "@hocuspocus/provider"]) {
      vi.doUnmock(specifier);
    }
  });

  it("holds children back until the peers load, then renders them", async () => {
    let releasePeers: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      releasePeers = resolve;
    });
    vi.resetModules();
    vi.doMock("./editor-peers", async () => ({
      ...(await vi.importActual<typeof EditorPeers>("./editor-peers")),
      loadEditorProviderPeers: async () => {
        await gate;
        return stubPeers();
      },
    }));
    const { EditorProvider } = await import("./editor-provider");

    render(
      <EditorProvider
        websocketUrl="wss://collab.example/ws"
        documentName="doc:readme"
        token="jwt"
        user={{ name: "Ada" }}
      >
        <span data-testid="child">connected surface</span>
      </EditorProvider>,
    );

    // A child that rendered before the provider would throw out of
    // `useEditorContext`, so the wrapper must render nothing while the gate
    // holds the loader.
    expect(screen.queryByTestId("child")).toBeNull();
    expect(StubHocuspocusProvider.instances).toHaveLength(0);

    releasePeers?.();

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
    expect(StubHocuspocusProvider.instances).toHaveLength(1);
  });
});
