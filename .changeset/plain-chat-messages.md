---
"@tangle-network/ui": patch
---

Export `mapPlainChatMessages` so a product that stores plain `{ role, content, model }` turns can render them through the shared chat container. `ChatContainer`'s `partMap` is optional (defaults to an empty map) for transcripts that do not carry agent parts yet. Session messages may carry an optional `model` id.
