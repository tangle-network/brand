---
"@tangle-network/ui": patch
---

Export the existing native event-stream lifecycle from hooks so imperative adapters share the hook's cursor, reconnect, terminal-event and cleanup behavior. Native retries now back off during outages; buffered streams retain their configured policy.

Delegated hover anchors that attach after pointer entry now open through the same token delay as direct triggers.
