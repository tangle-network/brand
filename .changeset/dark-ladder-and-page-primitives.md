---
"@tangle-network/brand": minor
"@tangle-network/ui": minor
---

Raise the dark surface ladder to AA and add the page-level primitives.

In the dark spine, `--md3-surface-container-high` and `--md3-surface-container-highest` sat close enough to the ink ramp that `--text-dim` fell under 4.5:1 on them. The ladder is re-spaced and the ink ramp moves with it, so every ink tier clears AA on all five planes.

Dark status chips keep their hue, drop 14% chroma, and lift the fill to 1.50:1 from the card. A new `--run-mix-*` ramp carries proportional bars, spaced in relative luminance so adjacent segments clear the 3:1 floor for non-text contrast.

`@tangle-network/ui` gains four primitives: `PageHeader`, `StatusPill`, `MetricStrip`, and `Toolbar`/`FilterField`. All additive; no existing export changes.
