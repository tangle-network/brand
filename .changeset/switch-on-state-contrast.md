---
"@tangle-network/ui": patch
---

Switch: draw the on state as an `--accent-text` track carrying a `bg-card` thumb. The `bg-primary` track measured 2.4:1 against the dark card and canvas, and its `bg-background` thumb 2.5:1 against the track, so a checked switch did not clear the 3:1 non-text floor in dark themes. Accent text clears 3:1 against the card and the canvas in every theme, which `@tangle-network/brand` now asserts per theme.
