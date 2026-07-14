---
"@tangle-network/brand": minor
---

Ship the indigo surface ladder as the canonical Tangle palette.

The `:root` spine was a flat, desaturated neutral. Every product app overrode it with its own hand-written palette, so brand's own colors were rendered almost nowhere — and the apps that did inherit them read as grey and washed out, because a flat ladder forces surface separation onto borders instead of fills.

Both themes now ship the ladder the products actually converged on: an indigo-cast dark scale stepped in even ~4-5% lightness increments, and a light scale of white paper on a tinted canvas rather than white-on-white. Surfaces, depth scale, sidebar and `--bg-root` all move together so the ladder stays coherent.

Visual change for every consumer. Apps that were overriding the spine should delete those overrides; apps that were inheriting it get the branded look with no code change.

Also adds a dark-only `intelligence` named theme — a violet surface ramp — and exports the named-theme stylesheet as `./styles/named-themes.css`, so named themes can be imported at all (they shipped, but no export reached them). The name is deliberately not `themes.css`: one letter from the existing `./styles/theme.css` (the Tailwind `@theme` map) is a typo that fails silently. A named theme re-skins surfaces only; the Tangle accent stays put.
