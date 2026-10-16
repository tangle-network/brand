# Tooltip accepted reopen — #10230

The shared Root keeps an accepted reopen open while Radix retains exit content. Normal uncontrolled/default-open failures go from four of four to zero of four; the complete candidate passes all twelve cases.

Radix's uncontrolled Root broadcasts `tooltip.open` after committing open state. Its retained Content listener can close that same Root. The shared owner supplies Radix's controlled path for both public modes, sending that notification before committing the new value. Other open tooltips still close. Public controlled/defaultOpen/callback props survive; Content, positioning, refs, disabled-button semantics, dependencies, timing roles and SurfaceMotion are unchanged.

| Check | Source | Result | Receipt |
| --- | --- | --- | --- |
| Native keyboard baseline | `19fd6eacdb6fd5acdede145397e18aae9e0fb684` | 8 pass, 4 qualified failures, 0 invalid | [baseline](native-red/receipt.json) |
| Accepted reopen, sibling closure, disabled safety | `18082fce972f55a29e3efd0dc13e3bba82553f2c` | 12 valid passes | [candidate](green/receipt.json) |
| Withheld CSS end/cancel events | `4ffd27539417ae714f4112b8eac729ea18eb5ff4` | 16 passes | [dismissal](final-dismiss/receipt.json) |
| Calibrated close/reopen trajectory | same | 6 passes | [reversals](final-retarget/receipt.json) |
| Normal/reduced and live preference change | same | 2 passes | [preferences](final-preference/receipt.json) |

The final normal Beelink gate `beelink1-dbe724aef89a3b06da97120f2eca978f` exited 0 at 2026-10-16T03:25:33Z (122 seconds, 18 seconds waiting). Frozen install, typecheck, Brand/UI builds and the three final browser probes passed. Package runtime bytes are unchanged between candidate and final proof. Additional commits retain browser traces and isolate the added Tooltip controls to their explicit fixture query.

## Input and exclusions

Both Tooltip cohorts use the real Provider/Root/Trigger/Content and a labelled focusable group containing a native disabled button, at widths 390/1440 with normal/reduced motion and controlled/uncontrolled/default-open modes. The installed shared cohort is React 19.3.0 / Radix Tooltip 1.2.16. The originating consumer uses React 18.3.1. Its historical Tooltip identity was initially misreported from a root-module lookup: Tooltip 1.2.10 / Presence 1.1.6 belong to its legacy local dependency. The consumer owner corrected this on 2026-10-16: UI-relative resolution in the unchanged UI11.38.1 install and its frozen lock derive Tooltip 1.4.1 / Presence 1.1.11. The original browser did not snapshot those nested paths, so this is derived historical identity rather than an original browser measurement. The accepted focus/open/reclose trace and artifact/SurfaceMotion/CSS hashes are unchanged. The new UI11.38.2 consumer proof must record actual UI-relative module paths, versions and hashes; its result remains with that owner.

The native baseline uses Tab/Shift+Tab. The candidate retains native Tab departure and a fresh native-keyboard control, then restores native DOM focus inside the browser when closed DOM state publishes. This avoids a second host round trip inside the role deadline. No events or Root state are injected. Normal cases require actual accepted reopen before the unchanged scoped dismissal deadline, retained node identity, description restoration and survival past the old deadline; reduced cases require replacement and persistence. Each passing case also checks real sibling dismissal and disabled-action safety.

A fresh identical-instrument baseline `a84bc744710aa3136bb046900dec2a49b76f946b` reproduced the same four failures: seven qualified controls passed, one controlled preparation never mounted and is excluded. Earlier candidate attempts contained late-input or uncalibrated captures; those are inconclusive. An earlier regression run never mounted Hint. All original receipts/media remain in the lane archive. The valid candidate and final records above establish the checked behavior; no timing threshold was relaxed. The cause of the earlier fixture preparation failures remains unresolved.

Each receipt maps its uncut recordings under its adjacent `videos/` folder. There are 92 stills and 48 mapped recordings in this evidence bundle; JSON numbers are rounded to six decimals, with original precision retained locally. This is isolated fixture proof. Publication, the original installed consumer, served adoption and calibrated production latency are separate checks.

Reproduce through the maintained Beelink gate with `scripts/tooltip-reopen-proof.mjs`, `scripts/surface-dismiss-proof.mjs`, `scripts/surface-retarget-proof.mjs` and `scripts/motion-contract-proof.mjs` after the Brand/UI builds. The probes use the existing design-contract server; no unit/mock test or CI gate is introduced.
