---
"@tangle-network/ui": minor
---

The rich Markdown editor writes back the file's own bytes. Opening a file and leaving it reports no change; an edit changes only the edited span, keeping list markers, emphasis delimiters, escapes, setext headings, reference links and blank lines as written. Blocks the editor has no node for (GFM tables, raw HTML, images, task lists, link definitions) are shown read-only and kept verbatim, so opening Edit no longer flattens a table into one paragraph.

`DocumentEditorPane` and `FileArtifactPane`'s `editor` option take `dirty`, so a host that tracks unsaved edits itself drives the save state and the Save button. The pane shows one save state at 14px ("Unsaved changes", "Saving…" or "Saved"), shows Save only while there is something to save, and saves on Ctrl+S / Cmd+S.
