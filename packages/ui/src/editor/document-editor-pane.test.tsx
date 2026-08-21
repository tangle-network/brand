import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as EditorPeers from "./editor-peers";

const markdown = "# Release notes\n\nThe editor loads on demand.";

afterEach(() => {
  vi.resetModules();
});

/** Loads the pane with every peer loader rejecting, as for a consumer that
 *  installed neither tiptap nor the collaboration stack. The spies report
 *  whether a render reached a loader at all. */
async function paneWithoutPeers(message: string) {
  const loaders = {
    loadDocumentEditorPeers: vi.fn(async () => {
      throw new Error(message);
    }),
    loadCollaborationPeers: vi.fn(async () => {
      throw new Error(message);
    }),
    loadEditorProviderPeers: vi.fn(async () => {
      throw new Error(message);
    }),
  };
  vi.resetModules();
  vi.doMock("./editor-peers", async () => ({
    ...(await vi.importActual<typeof EditorPeers>("./editor-peers")),
    ...loaders,
  }));
  const { DocumentEditorPane } = await import("./document-editor-pane");
  return { DocumentEditorPane, loaders };
}

describe("DocumentEditorPane without the editor peers", () => {
  it("renders the preview, because only the edit tab needs the peers", async () => {
    const { DocumentEditorPane, loaders } = await paneWithoutPeers(
      "peers are not installed",
    );

    render(<DocumentEditorPane title="Notes" markdown={markdown} />);

    // The promise this pane's editors carry is exactly this: a consumer that
    // never opens the edit tab pays nothing for tiptap.
    expect(screen.getByText("Release notes")).toBeInTheDocument();
    expect(screen.getByText("The editor loads on demand.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Edit" })).toBeInTheDocument();

    // Reaching no loader is the claim. Asserting only that the placeholder is
    // absent would also pass for a pane that rendered nothing at all.
    await waitFor(() => {
      expect(screen.queryByText("Loading editor…")).toBeNull();
    });
    expect(loaders.loadDocumentEditorPeers).not.toHaveBeenCalled();
    expect(loaders.loadCollaborationPeers).not.toHaveBeenCalled();
    expect(loaders.loadEditorProviderPeers).not.toHaveBeenCalled();
  });
});
