---
"@tangle-network/ui": patch
---

`DropdownMenuContent` returns focus to its trigger without the keyboard focus ring when the menu closed after a pointer choice. Radix restores focus with a plain `focus()`, which Chromium draws as `:focus-visible`. Every bordered trigger therefore kept a ring after a mouse selection until focus moved elsewhere. A keyboard choice still shows the ring.
