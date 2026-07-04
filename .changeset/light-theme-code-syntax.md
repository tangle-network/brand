---
"@tangle-network/brand": patch
---

Fix code syntax highlighting contrast (WCAG AA). `--syntax-*` was defined only in the dark `:root`, so in all four light themes (light, aubergine-light, arena-light, tangle-light) code rendered near-white on the light `bg-card` — foreground ~1.2:1, effectively invisible. Added a light-tuned `--syntax-*` palette (dark-on-light, all ≥4.5:1 on white) for every light scope. Also bumped the dark `--syntax-comment` (`#6B7094`→`#8b8fbc`) which failed AA (~3.4:1) across the dark-family themes. All syntax colors now pass AA on their code surface in every theme.
