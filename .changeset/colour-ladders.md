---
"@tangle-network/brand": minor
---

Add opt-in colour ladders and a semantic token layer.

`@tangle-network/brand/styles/ladders.css` defines 12 ramps of 12 steps, light and dark, from Radix Colors 3.0.0, with role aliases (`--gray-*`, `--accent-*`, `--success-*`, `--warning-*`, `--danger-*`, `--info-*`) and a per-domain ramp under `[data-domain]`.

`@tangle-network/brand/styles/system.css` maps every `tokens.css` family onto a ladder step and adds semantic tokens, role radii, type roles, motion and three shadow levels. Light pages become white and dark becomes a neutral mauve ladder. It is opt in: nothing changes for an app that does not import it.

`scripts/gen-ladders.mjs` generates both files; `pnpm --filter @tangle-network/brand gen:ladders` rewrites them.
