---
"@tangle-network/brand": minor
"@tangle-network/ui": minor
---

Raise the dark surface ladder to AA and add the page-level primitives.

In the dark spine, `--md3-surface-container-high` and `--md3-surface-container-highest` sat close enough to the ink ramp that `--text-dim` fell under 4.5:1 on them. The ladder is re-spaced and the ink ramp moves with it, so every ink tier clears AA on all five planes.

Dark status chips keep their hue, drop 14% chroma, and lift the fill to 1.50:1 from the card. A new `--run-mix-*` ramp carries proportional bars, spaced in relative luminance so adjacent segments clear the 3:1 floor for non-text contrast.

One light token moves: `--surface-warning-text` goes `#b45309` to `#ab4f09`. It is a contrast fix, not a hue change. The old value measured 4.16:1 on the light page canvas, under the 4.5:1 body floor, whenever the colour was used as text away from its own pill background; the new value measures 4.51:1 there and 5.25:1 on the pill. Every other light value is unchanged.

`@tangle-network/ui` gains four primitives: `PageHeader`, `StatusPill`, `MetricStrip`, and `Toolbar`/`FilterField`. All additive; no existing export changes.
