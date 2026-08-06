---
"@tangle-network/brand": minor
"@tangle-network/ui": patch
---

Retune the token spine to a neutral-grey surface ladder with indigo as trim rather than as field, in both themes. Surfaces separate by their own fill so a card, a nested panel and an overlay each read as a distinct plane, and the canvas sits off pure black so long reading sessions land away from the glare end of the range.

Faint text in `Input`, `Textarea`, `StatCard` and `TerminalLine` now takes a dedicated `--text-dim` token instead of a faded stronger one. A translucent foreground renders as its colour composited over the plane behind it, so those hints, subtitles and timestamps measured differently on a card than on the canvas and fell under the 4.5:1 floor on both.

**Worth a look after upgrading:** in dark mode `--sidebar-background` is now one step BELOW the canvas rather than above it, so the nav reads as chrome the content sits in front of instead of as another raised card. Apps that composited their own surfaces on top of the sidebar assuming it was the lighter plane should give that area a visual pass. Light mode is unchanged — the sidebar is still paper on a grey canvas.
