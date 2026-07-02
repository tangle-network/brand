---
"@tangle-network/brand": patch
---

Fix `[data-theme]` scopes not re-skinning components, and lift the aubergine palette off near-black so it reads as purple.

The named themes changed `--hsl-*` spine vars, but Tailwind utilities (`bg-card`, `bg-primary`, `border-border`, `bg-surface-container*`) read the `--color-*` layer, which is declared only at `:root` — so its computed neutral value was inherited by themed subtrees regardless of the spine override (a double-indirection custom-property inheritance trap). Each `[data-theme]` scope now redeclares the `--color-*` layer directly, forcing it to recompute from that element's own `--hsl-*`. Aubergine's base lightness is raised (~7%→12–20% L, higher saturation) so surfaces read aubergine-purple instead of black.
