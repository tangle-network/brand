---
"@tangle-network/ui": patch
---

Export the existing native event-stream lifecycle from hooks so imperative adapters share the hook's cursor, reconnect, terminal-event and cleanup behavior.
