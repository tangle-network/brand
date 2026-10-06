---
"@tangle-network/brand": patch
---

Accent text now reads at 4.5:1 on a selected item's primary tint (10–20%) over the canvas, card and muted surfaces in every theme scope. Darkened light `--accent-text`: canonical, legacy-light, agents-light and website light #5047eb → #3c32e9; aubergine-light #6d28d9 → #6423c8; arena-light #047857 → #03674b; tangle-light #4f46e5 → #453be3; system light iris-11 (#5753c6) → #4e4ac3. Lightened hospitality dark #76b791 → #99caad, with its `--md3-primary` kept equal to the accent text. A new `accent-on-tint.test.ts` asserts the pair for every scope, sharing the scope list with the Switch contrast suite through `theme-scopes.ts`. Agent App projects these values from Brand, so apps pick them up with the next Agent App release built on this version.
