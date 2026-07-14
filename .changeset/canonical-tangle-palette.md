---
"@tangle-network/brand": minor
---

Ship the indigo surface ladder as the canonical Tangle palette.

The `:root` spine was a flat, desaturated neutral. Every product app overrode it with its own hand-written palette, so brand's own colors were rendered almost nowhere — and the apps that did inherit them read as grey and washed out, because a flat ladder forces surface separation onto borders instead of fills.

Both themes now ship the ladder the products actually converged on: an indigo-cast dark scale stepped in even ~4-5% lightness increments, and a light scale of white paper on a tinted canvas rather than white-on-white. Surfaces, depth scale, sidebar and `--bg-root` all move together so the ladder stays coherent.

Visual change for every consumer. Apps that were overriding the spine should delete those overrides; apps that were inheriting it get the branded look with no code change.
