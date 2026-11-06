---
"@tangle-network/ui": patch
---

Restore `LiveDuration` and `RunRowStatusDot` in `@tangle-network/ui/run`. @tangle-network/sandbox-ui 7.0.2 imports both, so their removal in 11.51.14 broke consumers in a patch release.
