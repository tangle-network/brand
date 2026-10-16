---
"@tangle-network/ui": patch
---

Bound shared surface dismissal by its scoped role deadline so missing CSS animation events cannot strand Radix cleanup or focus return. Preserve retained motion values on reopen.
