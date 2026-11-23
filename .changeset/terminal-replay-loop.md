---
"@tangle-network/ui": patch
---

Marketing: `TerminalReplay` takes `elapsedMs` from a caller's clock and plays the recording's paced timeline in a loop, resting `loopHoldMs` (3 s by default) on the last frame, with no transport bar. One clock can drive a grid of recordings while each still compresses its idle time. A controlled replay exposes the recorded time it shows as `data-position-ms`.
