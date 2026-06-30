---
"@tangle-network/ui": minor
---

Calmer, unified agent transcript. The tool-call rows read as harsh black-and-white outlines on dark surfaces; soften the whole transcript to one calm design language:

- `ToolCallStep` (used by `AgentTimeline`): subtle `--border-subtle` row border instead of full-strength `border-border`, a borderless tinted status badge, and a quiet status glyph (green check / red alert) in place of the loud bordered uppercase `SUCCESS`/`ERROR` pill.
- `InlineToolItem` (used by `RunGroup`): same subtle border, and a blueprint-style accent left-border indent on the expanded detail so expanding reads cleanly.

No API or capability changes — purely the visual treatment, applied consistently so `RunGroup` and `AgentTimeline` share one calm look.
