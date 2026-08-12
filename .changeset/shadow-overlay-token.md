---
"@tangle-network/brand": minor
---

Add `--shadow-overlay`, the elevation step above `--shadow-dropdown` for a surface that covers the page rather than sitting beside it — a drawer, a modal, a floating dock.

It is derived from `--hsl-foreground` rather than a fixed `rgba`, so it inverts with the theme: dark ink in light, a soft halo in dark. That is what makes it work on a dark canvas, where a black shadow renders as nothing. One declaration serves both themes, and the token is declared in the `@theme` block as well so Tailwind emits a `shadow-overlay` utility.
