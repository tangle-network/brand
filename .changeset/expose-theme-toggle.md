---
"@tangle-network/ui": patch
---

Expose `ThemeToggle` and `useTheme` from `@tangle-network/ui/primitives`. The component and hook were bulk-imported in `1.0.0` but never wired into `primitives/index.ts`, leaving them inaccessible to consumers.
