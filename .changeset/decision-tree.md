---
"@tangle-network/ui": minor
---

`DecisionTree` (from `./run`) is the human-in-the-loop card: an agent's question with its numbers and risk, the branches it offers with their consequences and its pick, follow-up questions a branch needs, and a free-text "do this instead". Keys 1–N pick a branch, Escape steps back, ←/→ page between waiting decisions. After a choice it collapses to the chosen path and shows "Approved · running" until the host reports the agent's outcome; `chosen` restores an answered decision.
