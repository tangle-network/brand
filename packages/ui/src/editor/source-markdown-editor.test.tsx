import { act, render, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownDocumentEditor } from "./markdown-document-editor";
import { CALL_SHEET, KITCHEN_SINK } from "./source-markdown.fixtures";

// The first render imports tiptap for real; a cold import on a busy runner
// takes several seconds.
const PEERS_LOADED = { timeout: 15_000 };
const LOADS_PEERS = 30_000;

async function openEditor(value: string) {
  const onChange = vi.fn<(markdown: string) => void>();
  let editor: Editor | null = null;
  const view = render(
    <MarkdownDocumentEditor
      value={value}
      onChange={(markdown) => onChange(markdown)}
      onReady={(ready) => {
        editor = ready;
      }}
    />,
  );
  // The first mount after the peers load can replace its editor instance, so
  // wait for a live one and hand back the latest.
  await waitFor(() => {
    expect(editor).not.toBeNull();
    expect((editor as Editor | null)?.isDestroyed).toBe(false);
  }, PEERS_LOADED);
  return {
    view,
    get editor() {
      return editor! as Editor;
    },
    onChange,
    /** The Markdown the editor last reported, or the value it opened. */
    saved: () => onChange.mock.calls.at(-1)?.[0] ?? value,
  };
}

/** Document position at the start or end of the first text node containing `needle`. */
function textPosition(editor: Editor, needle: string, edge: "start" | "end" = "end"): number {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found >= 0) return false;
    const index = node.isText ? (node.text ?? "").indexOf(needle) : -1;
    if (index >= 0) found = pos + index + (edge === "end" ? needle.length : 0);
    return true;
  });
  if (found < 0) throw new Error(`Not in the document: ${needle}`);
  return found;
}

function insertAfter(editor: Editor, needle: string, text: string) {
  act(() => {
    editor.commands.insertContentAt(textPosition(editor, needle), text);
  });
}

function tableRows(markdown: string) {
  return markdown.split("\n").filter((line) => line.startsWith("|"));
}

describe("MarkdownDocumentEditor source preservation", () => {
  it("opens every Markdown construct without reporting a change", async () => {
    const { editor, onChange, view } = await openEditor(KITCHEN_SINK);
    act(() => {
      editor.commands.setTextSelection(1);
      editor.setEditable(false);
      editor.setEditable(true);
    });
    expect(onChange).not.toHaveBeenCalled();
    // The table is shown as a table, read-only, instead of a run-on paragraph.
    const table = view.container.querySelector('[data-md-kind="table"] table');
    expect(table?.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(table?.textContent).toContain("Center");
  }, LOADS_PEERS);

  it.each([
    ["a paragraph with escapes", "snake_case_name", " (edited)"],
    ["a star bullet", "star bullet two", "!"],
    ["a nested bullet", "nested four-space", " item"],
    ["a paren-ordered item", "paren ordered", " list"],
    ["a setext heading", "Setext heading", " again"],
    ["a fenced code block", "const x = 1", "0"],
    ["a tilde fence", "tilde fence", "d"],
    ["a nested quote", "nested quote", "d"],
    ["the last paragraph", "next line", "."],
  ])("changes only the edited span when typing into %s", async (_name, needle, text) => {
    const { editor, saved } = await openEditor(KITCHEN_SINK);
    insertAfter(editor, needle, text);
    expect(saved()).toBe(KITCHEN_SINK.replace(needle, needle + text));
  }, LOADS_PEERS);

  it("keeps every table row when the title is edited, the failure founders hit", async () => {
    const { editor, saved } = await openEditor(CALL_SHEET);
    act(() => {
      editor.commands.insertContentAt(textPosition(editor, "Plausible Analytics:", "start"), "Draft: ");
    });
    expect(saved()).toBe(CALL_SHEET.replace("# Plausible", "# Draft: Plausible"));
    expect(tableRows(saved())).toEqual(tableRows(CALL_SHEET));
    expect(tableRows(saved())).toHaveLength(5);
  }, LOADS_PEERS);

  it("separates a paragraph added with Enter by a blank line", async () => {
    const { editor, saved } = await openEditor(CALL_SHEET);
    act(() => {
      editor.chain().setTextSelection(textPosition(editor, "positioning Plausible.")).splitBlock().run();
      editor.commands.insertContent("A new line of notes.");
    });
    expect(saved()).toBe(
      CALL_SHEET.replace("positioning Plausible.\n", "positioning Plausible.\n\nA new line of notes.\n"),
    );
  }, LOADS_PEERS);

  it("adds only the delimiters when a word is bolded", async () => {
    const { editor, saved } = await openEditor(CALL_SHEET);
    const end = textPosition(editor, "Who signs off");
    act(() => {
      editor.chain().setTextSelection({ from: end - "signs off".length, to: end }).toggleBold().run();
    });
    expect(saved()).toBe(CALL_SHEET.replace("Who signs off", "Who **signs off**"));
  }, LOADS_PEERS);

  it("adds an item in the list's own marker style", async () => {
    const { editor, saved } = await openEditor(CALL_SHEET);
    act(() => {
      editor.chain().setTextSelection(textPosition(editor, "after the call")).splitListItem("listItem").run();
      editor.commands.insertContent("Log the objections");
    });
    expect(saved()).toBe(CALL_SHEET.replace("after the call\n", "after the call\n* Log the objections\n"));
  }, LOADS_PEERS);

  it("removes only the table when its block is deleted", async () => {
    const { editor, saved } = await openEditor(CALL_SHEET);
    let tablePos = -1;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === "markdownSource") tablePos = offset;
    });
    act(() => {
      editor.chain().setNodeSelection(tablePos).deleteSelection().run();
    });
    const start = CALL_SHEET.indexOf("| Competitor");
    const end = CALL_SHEET.indexOf("## Qualifying");
    expect(saved()).toBe(CALL_SHEET.slice(0, start) + CALL_SHEET.slice(end));
  }, LOADS_PEERS);

  it("reports the original bytes again once an edit is undone", async () => {
    const { editor, saved } = await openEditor(KITCHEN_SINK);
    insertAfter(editor, "star bullet one", "?");
    act(() => {
      editor.commands.undo();
    });
    expect(saved()).toBe(KITCHEN_SINK);
  }, LOADS_PEERS);
});
