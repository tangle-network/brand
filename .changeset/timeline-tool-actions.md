---
"@tangle-network/ui": minor
---

AgentTimeline now accepts `renderToolActions` (and carries the source `ToolPart` on its tool items) so consumers can render actions beside a tool call — e.g. "open in artifacts". Previously these hooks reached only the run-grouped `MessageList`, not the timeline presentation. ChatContainer exposes this through a new `renderTimelineToolActions?(part)` prop; the existing `renderToolActions(part, options)` contract for the `runs` presentation is unchanged.

The timeline tool-call summary now shows a human-readable detail (file path / command via `getToolDisplayMetadata`) instead of the raw input JSON, and drops the redundant `title: description` label. The source `ToolPart` is threaded into `ToolCallStep`, so the expanded detail renders the full input + output via `ExpandedToolDetail` (previously the timeline's expanded view showed only the output).
