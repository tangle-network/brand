---
"@tangle-network/ui": minor
---

Chat-grade components:

- **Markdown tables** render as cards with a header row, subtle row lines, right-aligned tabular figures, a Copy CSV control, and horizontal scrolling inside the card on narrow screens.
- **Code blocks** highlight with Shiki in Brand's syntax colors, name their file from the fence (`title="src/x.ts"`, `ts:src/x.ts`, or a bare path), and render single-line fences as blocks. react-syntax-highlighter is no longer a dependency.
- **Link chips:** a host can render links to known objects as icon chips with `Markdown`'s new `linkChip` resolver.
- **Run components:** `ui/run` adds `TaskList` (status pills, with priority shown only when tasks differ), `ApprovalCard` with `ApprovalDiffSummary` (plain-language title, plan step, files with +/− lines, raw input behind Details), and `RunPhaseList` (tool runs grouped by step, one line each).
