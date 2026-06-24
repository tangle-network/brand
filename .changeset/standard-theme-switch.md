---
"@tangle-network/brand": minor
---

Add a standard `data-theme`/`.dark`/`.light` switch alongside the existing named themes. The dark block now also matches `[data-theme="dark"]`/`.dark` and the light block also matches `[data-theme="light"]`/`.light`, so consumers can pin or toggle a theme with a standard switch instead of an ad-hoc `data-sandbox-theme` name (an unknown name previously fell back to the dark default). The `:root` default stays dark — zero blast radius to existing consumers.
