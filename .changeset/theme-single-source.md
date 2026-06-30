---
"@tangle-network/brand": minor
---

Fix the dark theme being unresponsive to token changes + harsh on dark surfaces — root cause was the `@theme` layer.

- **Single source of truth for semantic tokens.** `theme.css` now maps every shadcn/MD3 utility token (`--color-background/card/border/muted/popover/secondary/accent/destructive/ring/input` + `--color-surface-container*`) onto the `tokens.css` spine via `var()`, instead of leaving them undefined (forcing every app to re-define them) and hardcoding a now-stale `--color-depth-*` copy. Editing the spine in `tokens.css` now actually flows through to `bg-card` / `border-border` / `bg-muted` everywhere.
- **Comfortable dark surface ladder.** Lift the canvas off near-black (`#0b0b0d` → `#15151a`) and spread the surface/depth/MD3 ladder so panels separate by *fill*, with the border softened (`13%` → `16%` lightness) so it recedes instead of reading as a bright outline on black.
