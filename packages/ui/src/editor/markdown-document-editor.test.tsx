import { render, screen, waitFor } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownDocumentEditor } from "./markdown-document-editor";
import type * as EditorPeers from "./editor-peers";

class ErrorTrap extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  render() {
    return this.state.message ?? this.props.children;
  }
}

/**
 * Imports the editor with a fresh module graph, so its module-scope `lazy`
 * has not resolved yet. `loadDocumentEditorPeers` is replaced by `load`.
 */
async function freshEditor(load: () => Promise<EditorPeers.DocumentEditorPeers>) {
  vi.resetModules();
  vi.doMock("./editor-peers", async () => ({
    ...(await vi.importActual<typeof EditorPeers>("./editor-peers")),
    loadDocumentEditorPeers: load,
  }));
  return (await import("./markdown-document-editor")).MarkdownDocumentEditor;
}

afterEach(() => {
  vi.doUnmock("./editor-peers");
  vi.resetModules();
});

describe("MarkdownDocumentEditor", () => {
  it("renders the real tiptap surface once the peers load", async () => {
    const { container } = render(
      <MarkdownDocumentEditor value={"# Title\n\nBody text."} />,
    );

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror")).not.toBeNull();
    });

    const surface = container.querySelector(".ProseMirror");
    expect(surface?.querySelector("h1")?.textContent).toBe("Title");
    expect(surface?.textContent).toContain("Body text.");
    // StarterKit arrives through `peers.starterKit.default`. A broken hand-off
    // leaves the document without the heading node that StarterKit configures.
    expect(screen.getByTitle(/^Bold/)).toBeInTheDocument();
  });

  it("holds a placeholder while the peers are still loading", async () => {
    let releasePeers: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      releasePeers = resolve;
    });
    const HeldEditor = await freshEditor(async () => {
      await gate;
      const actual = await vi.importActual<typeof EditorPeers>("./editor-peers");
      return actual.loadDocumentEditorPeers();
    });

    const { container } = render(<HeldEditor value="# Title" />);

    expect(screen.getByText("Loading editor…")).toBeInTheDocument();
    expect(container.querySelector(".ProseMirror")).toBeNull();

    releasePeers?.();

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror h1")?.textContent).toBe("Title");
    });
    expect(screen.queryByText("Loading editor…")).toBeNull();
  });

  it("applies a new value prop to the loaded editor without reporting a change", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <MarkdownDocumentEditor value="start" onChange={onChange} />,
    );

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror")).not.toBeNull();
    });

    // The editor reports once when it parses the initial content. What must
    // not grow is the count across a value-prop write: pushing that back
    // through onChange makes a controlled parent echo its own write.
    const callsAfterMount = onChange.mock.calls.length;

    rerender(<MarkdownDocumentEditor value="# Changed" onChange={onChange} />);

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror h1")?.textContent).toBe("Changed");
    });
    expect(onChange).toHaveBeenCalledTimes(callsAfterMount);
  });

  it("fails with the install list when the peers cannot be loaded", async () => {
    const missing = "install @tiptap/react and @tiptap/starter-kit";
    const LoadFailingEditor = await freshEditor(async () => {
      throw new Error(missing);
    });

    render(
      <ErrorTrap>
        <LoadFailingEditor value="start" />
      </ErrorTrap>,
    );

    // Loud, and only here: the consumer's build already succeeded without the
    // peers, so this render is the first place the gap can surface.
    await waitFor(() => {
      expect(screen.getByText(missing)).toBeInTheDocument();
    });
  });
});
