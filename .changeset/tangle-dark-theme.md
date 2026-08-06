---
"@tangle-network/brand": minor
---

Add the missing `tangle-dark` named theme. The published named-themes set shipped `tangle-light` with no dark sibling, so a consumer switching named themes via `data-theme` could select every dark theme except the canonical one — `data-theme="tangle-dark"` matched no rule and silently fell through to whatever the element inherited (the light spine's `--hsl-*` values, if it sat inside a light-named wrapper).

`tangle-dark` names the default `:root`/`.dark` spine explicitly: same indigo hue family as `tangle-light` (~239-246), graphite-indigo neutrals, elevation by lightening, and the dark contrast discipline (AAA body ink, the fill indigo carrying white at 7.4:1, the bright indigo reserved for accent text). Its values mirror `tokens.css` exactly and are pinned against it in `named-themes.test.ts`, so the named theme and the default spine cannot drift apart. Status tokens are deliberately not redeclared — the dark `:root` status palette is already dark-tuned, same contract as `aubergine`/`arena`.
