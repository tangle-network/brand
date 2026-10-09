---
"@tangle-network/ui": patch
---

The Markdown table card and link chips now out-rank `.tangle-prose` rules inside the renderer. A consumer that ships an older copy of those rules no longer turns the table into its own scroller, adds cell borders, left-aligns figure headers, or underlines and recolors chips.
