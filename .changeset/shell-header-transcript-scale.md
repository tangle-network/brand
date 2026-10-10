---
"@tangle-network/brand": minor
"@tangle-network/ui": minor
---

One shell header height and one transcript type scale. Brand adds `--shell-header-height` (56px, utility `h-shell-header`) and `--shell-inset-gutter` so every shell header row shares one bottom divider, and `--transcript-font-size` / `--transcript-line-height` with the `tangle-transcript-text` rule. UI's `AgentTimeline`, `UserMessage` and `ChatMessage` set the person's and the agent's message text with the same `TRANSCRIPT_TEXT` treatment (exported), so they differ only by alignment and surface; an agent message no longer renders at a different leading from the person's. `tangle-drift` gates two new metrics: `header_height_literal` (a header row given its own height) and `transcript_type_override` (product CSS restyling transcript text).
