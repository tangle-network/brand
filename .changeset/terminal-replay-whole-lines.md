---
"@tangle-network/ui": patch
---

Marketing: a `readable` `TerminalReplay` narrower than its recording shows whole lines. The recording still plays at its own columns, so a full-screen TUI keeps its layout, and the screen is shown wrapped to the columns that fit the box, instead of cutting each line at the right edge. This needs the new optional peer `@xterm/addon-serialize`; without it, the replay scrolls sideways as before.
