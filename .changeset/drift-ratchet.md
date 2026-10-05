---
"@tangle-network/brand": minor
---

Add the `tangle-drift` bin: a ratchet on design-system drift (raw Tailwind palette classes, hex literals, arbitrary color values, CSS custom-property definitions, local primitive definitions) for the fifteen product surfaces. A consumer runs `tangle-drift check --surface <name> --repo-dir .` in its local gate; it exits 1 when any count rises above the baseline shipped in this package. See `docs/drift-ratchet.md`.
