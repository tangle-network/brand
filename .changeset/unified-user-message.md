---
"@tangle-network/ui": patch
---

One user-message bubble. There were two: the exported `UserMessage` (a loud filled purple bubble with an uppercase "You" label + shadow, used by the run/message list) and a separate cleaner inline bubble inside `AgentTimeline`. Unify on the clean one — `UserMessage` is now a quiet right-aligned bordered bubble on the muted surface (no fill, no uppercase label), and `AgentTimeline` renders through it instead of its own copy. `UserMessage` accepts either session-model `parts` or a direct `content`/`timestamp`, so both call sites share it.
