---
"@tangle-network/ui": minor
---

AgentTimeline now accepts `renderToolActions` (and carries the source `ToolPart` on tool items) so consumers can render actions beside a tool call — e.g. "open in artifacts". Previously these hooks reached only the run-grouped `MessageList`, not the timeline presentation.

The timeline tool-call summary now shows a human-readable detail (file path / command via `getToolDisplayMetadata`) instead of the raw input JSON, and drops the redundant `title: description` label. Full input still renders in the expanded detail. `ChatContainerProps.renderToolActions`'s `options` argument is now optional (omitted in the timeline, which has no run/message grouping).
