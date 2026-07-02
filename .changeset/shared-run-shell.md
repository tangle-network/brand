---
"@tangle-network/ui": minor
---

Converge the two transcripts on one collapsible run. New `AssistantRunShell` primitive (the header · summary · status pill · chevron · Radix collapse extracted from `RunGroup`) is now used by both `RunGroup` and `AgentTimeline`, so there is one implementation of "an assistant run" instead of two divergent ones. `AgentTimeline` folds consecutive tool / tool-group items into that shell (`collapsibleToolRuns`, default on; `defaultToolRunsOpen`, default open) so a burst of tool activity reads as one toggleable step on the timeline spine instead of a long ladder of rows — matching `RunGroup`. Additive: `AgentTimeline`'s `items[]` API is unchanged and folding happens internally; consumers building their own item arrays keep working.
