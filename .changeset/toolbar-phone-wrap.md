---
"@tangle-network/ui": patch
---

`Toolbar` wraps its filters below `lg` instead of scrolling them as one line, so a phone shows every filter: at 390px the second select had started at 403px, off screen. From `lg` up the filters still share one scrollable line. `SidebarDropZone` sets its title on the label size (`--font-size-label`, 14px) and its description on the help size (`--font-size-help`, 12px) instead of 12px and 10px literals, and `UploadProgress` sets its size and error lines on the help size.
