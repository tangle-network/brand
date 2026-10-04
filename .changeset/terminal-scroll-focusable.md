---
"@tangle-network/ui": patch
---

`CommandPreview` output regions are keyboard-focusable and labelled (stdout, stderr, error), so a long output that scrolls inside the block can be scrolled without a pointer (WCAG 2.1.1; axe `scrollable-region-focusable`).
