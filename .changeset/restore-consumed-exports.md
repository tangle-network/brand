---
"@tangle-network/ui": patch
---

Restore `isOpen` (`@tangle-network/ui/run`) and `formatCost` and `formatCount` (`@tangle-network/ui/utils`). 11.51.14 removed them as unused, but the Discovery viewer imports them, so the removal broke a public API in a patch release.
