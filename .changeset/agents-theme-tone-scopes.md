---
"@tangle-network/brand": minor
---

Add the `agents` / `agents-light` named theme for Agent Builder: white light pages whose cards separate by shadow, and a mauve neutral ladder in both modes. `scripts/gen-ladders.mjs` generates it from the same map as `system.css`, restricted to canonical spine tokens and with literal values, so it needs no `ladders.css`. It retints surfaces, text, borders and the three shadow roles only; accent, status and category tokens stay canonical. Both names join the canonical baseline selector lists, so nested scopes re-resolve their aliases.

Add `data-tone="<category>"` scopes for the eight categorical tones: an element with `data-tone="orange"` reads that family as `--tone-bg`, `--tone-bg-hover`, `--tone-bg-selected`, `--tone-border`, `--tone-border-selected`, `--tone-text` and `--tone-icon`, in both modes.
