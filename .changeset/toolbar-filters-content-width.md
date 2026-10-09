---
"@tangle-network/ui": patch
---

`Toolbar` keeps its filters at content width on one `lg` line while they fit, and gives search the rest between a 16rem floor and `max-w-sm`. The even split had clipped the Assets bar's third field (Schedule for) at the scroll edge at 1440px while search sat at 384px. Filters now shrink and scroll only once search is at its floor.
