---
"@tangle-network/brand": minor
---

`tokens.css` now defines the role radii (`--radius-tag`, `--radius-chip`, `--radius-field`, `--radius-panel`, `--radius-cover`, `--radius-sheet`), so apps that load tokens.css without system.css can use them instead of declaring their own. Values match system.css. Lower the SUPER drift baseline to CSS variable definitions 9.
