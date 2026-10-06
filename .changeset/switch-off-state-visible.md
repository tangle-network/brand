---
"@tangle-network/ui": patch
---

Switch: draw the off state as an outlined track with a filled thumb in `muted-foreground`, which clears 3:1 against the card and the canvas. The old filled `bg-input` track and `bg-background` thumb looked like one flat shape in both themes, so an unchecked switch could not be seen.
