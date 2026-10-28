---
"@tangle-network/ui": minor
---

AgentTimeline folds a run of steps into one row: a `fold` item names what its tool calls did ("Read 6 files · Ran 2 commands", `foldSummary`) and opens to the rows; a failed call keeps the row in the failure ink with its error under it. A user bubble can fold a long message to its first `collapsedLines` lines, with a fade and a "Show more" inside the bubble. The bubble's hover time reads at 14px.
