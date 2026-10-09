---
"@tangle-network/brand": patch
"@tangle-network/ui": patch
---

The `.tangle-prose` table rules (`display: block`, a sideways scroll on the table itself, and cell borders) now skip the Markdown table card, which marks its table `data-markdown-table` and scrolls inside its card. The prose link color and underline skip link chips (`data-link-chip`).
