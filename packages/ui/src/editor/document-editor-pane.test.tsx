import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const markdown = "# Release notes\n\nThe editor loads on demand.";

afterEach(() => {
  vi.resetModules();
});

/** Loads the pane with both peer loaders rejecting, as for a consumer that
 *  installed neither tiptap nor the collaboration stack. */
async function paneWithoutPeers(message: string) {
  vi.resetModules();
  vi.doMock("./editor-peers", () => ({
    loadDocumentEditorPeers: async () => {
      throw new Error(message);
    },
    loadCollaborationPeers: async () => {
      throw new Error(message);
    },
  }));
  return (await import("./document-editor-pane")).DocumentEditorPane;
}

describe("DocumentEditorPane without the editor peers", () => {
  it("renders the preview, because only the edit tab needs the peers", async () => {
    const DocumentEditorPane = await paneWithoutPeers("peers are not installed");

    render(<DocumentEditorPane title="Notes" markdown={markdown} />);

    // The promise this pane's editors carry is exactly this: a consumer that
    // never opens the edit tab pays nothing for tiptap.
    expect(screen.getByText("Release notes")).toBeInTheDocument();
    expect(screen.getByText("The editor loads on demand.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Edit" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading editor…")).toBeNull();
    });
  });
});
