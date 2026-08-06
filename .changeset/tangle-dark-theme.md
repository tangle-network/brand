---
"@tangle-network/brand": minor
---

Add the missing `tangle-dark` named theme. The named set shipped `tangle-light` with no dark sibling, so `data-theme="tangle-dark"` matched no rule and silently fell through to whatever the element inherited — the light spine's values, inside a light-named wrapper. `tangle-dark` now selects the canonical dark spine by name: same indigo family as `tangle-light`, held to the dark contrast discipline, and self-sufficient inside a light-named wrapper (foregrounds and destructive included, so nothing leaks the light values).
