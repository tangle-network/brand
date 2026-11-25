---
"@tangle-network/ui": patch
---

Marketing: a readable `TerminalReplay` fits the width it draws, not the width of its columns. A row of box-drawing or block glyphs that the mono font lacks comes from a fallback font with a wider advance and ran past the right edge of its box; the replay now measures the widest row it has drawn and leaves room for it when it picks the columns and the scale.
