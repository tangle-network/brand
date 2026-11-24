---
"@tangle-network/ui": patch
---

Marketing: `TerminalReplay` takes `elapsedMs` from a caller's clock and plays the recording's paced timeline in a loop. Each pass rests `loopHoldMs` (3 s by default) on the last frame that prints text, then starts again; it draws no transport bar. One clock can drive a grid of recordings, and each still compresses its idle time. A controlled replay exposes the recorded time it shows as `data-position-ms`.
