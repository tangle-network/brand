---
"@tangle-network/ui": minor
---

`RunRowShell`'s `title` prop widens from `string` to `ReactNode` — purely additive (strings render unchanged). Lets a row carry a treated title (e.g. an active-state shimmer sweep) so consumers composing the canonical run-row grammar don't have to re-fork the shell for it.
