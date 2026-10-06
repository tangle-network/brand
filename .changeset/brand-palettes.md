---
"@tangle-network/brand": minor
---

`palettes` exports Brand's resolved colors (light, dark, websiteLight, websiteDark) for renderers that cannot read CSS variables, such as PDF, canvas, WebGL, email and the theme-color meta. `scripts/gen-palette.mjs` generates them from tokens.css and named-themes.css, and the build fails when they are stale.
