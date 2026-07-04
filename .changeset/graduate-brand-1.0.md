---
"@tangle-network/brand": major
---

Graduate `@tangle-network/brand` to stable 1.0.0. The design-token + prose layer is mature and consumed across every app; declaring 1.0 lets its future minors stay within `@tangle-network/ui`'s `^1.x` peer range. Combined with the new `onlyUpdatePeerDependentsWhenOutOfRange` changeset option, this ends the churn where every brand minor force-majored `ui` (5→6→7… all the way to 10). After this one-time coordinated bump, brand token/prose changes no longer re-version `ui` at all — `ui` versions only when its own component code changes.
