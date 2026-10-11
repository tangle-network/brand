---
"@tangle-network/brand": minor
"@tangle-network/ui": patch
---

Fix shared defects from the Hospitality design audit.

Brand: dark `--destructive` is now a light red carrying dark ink (`0 90% 77%` on `0 60% 10%`), so `text-destructive` clears AA (at least 4.5:1) on the canvas, card, popover and muted planes of every dark theme; it measured 2.5:1 on Hospitality's dark card. Destructive fills keep their foreground at 8:1. The `--font-sans` and `--font-display` stacks name `"Inter Variable"` ahead of `"Inter"`, and the README now recommends `@fontsource-variable/inter` so apps render every weight the scale uses. Brand still loads no fonts itself.

UI: the `tabs` SegmentedControl scrolls the selected tab into view inside the strip (never the page) and fades the edge that has more tabs past it; tab items take a 44px hit height on coarse pointers; labels keep one weight in both variants, so changing the selection no longer shifts the row. SelectTrigger values end in an ellipsis with a gap before the chevron instead of clipping mid-glyph. Plain-text code fences (`text`, `txt`, `plain`, `plaintext`) show no language label.
