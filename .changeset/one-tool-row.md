---
"@tangle-network/ui": minor
---

Single tool-call row implementation. `ToolCallStep` (the timeline/feed row used by `AgentTimeline` and `ToolCallFeed`) is now a thin adapter over the canonical `InlineToolItem` — it maps its flat `label`/`status`/`detail`/`output`/`duration` props onto a `ToolPart` and delegates rendering. The duplicate bespoke row markup is deleted, so every transcript (`RunGroup`, `AgentTimeline`, `ToolCallFeed`) shares one row component and one look. `InlineToolItem` gains optional `title`/`description` overrides for callers that supply explicit labels. No public API changes.
