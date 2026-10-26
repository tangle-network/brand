---
"@tangle-network/ui": minor
---

FileTabs: the active tab paints the card plane and covers the strip's baseline, so it joins the content below it; the close button sits inside each tab; long names are cut in the middle so their end and extension stay readable. The strip is a `tablist` with one tab stop: arrow keys, Home and End move the selection, and Delete closes the focused tab. New `label` names the list (default "Open files"). A host whose own border is the baseline passes `shadow-none`, as FileArtifactPane does.
