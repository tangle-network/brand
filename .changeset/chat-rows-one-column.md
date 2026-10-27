---
"@tangle-network/ui": minor
---

A windowed transcript keeps the chat's rhythm and edge. `AgentTimeline` now renders through two new exports, `AgentTimelineColumn` (the centred reading column) and `AgentTimelineStep` (one row with the gap its neighbour pair calls for, from `agentTimelineStepKind`), so a consumer that virtualizes a long transcript renders its rows inside one column instead of one `AgentTimeline` per row.

`RunRowShell` (and so `InlineToolItem` and `InlineThinkingItem`) marks a failure on the row's own glyph, tinted to the danger ink beside the tool's name, instead of a red dot at the row's far edge. `data-run-row-status="error"` moves to the glyph slot. The collapsed error line, the hover duration, an opened reasoning body, a user message's timestamp row and the "Show more steps" toggle read at `text-sm` (14px) instead of 10–12px.
