# B1 shared hero evidence

Source checked: `215e2c12cf6c52c6da725326699388908d71b90b`. Baseline: `4919c826c0b594b36eedd66fba455557b5963ecc`. The baseline Hono view records the prior export boundary; it is not a consumer implementation. These are local package fixtures, not production adoption evidence.

Beelink: frozen install and typecheck passed; 18 affected tests passed; packed `brand/knot` imports with React unavailable. Changed browser proof passed 8/8 at 2026-10-15T20:27:50Z. All 16 before/after captures inspected. Each changed pair shares computed typography, CTA roles and knot paths, with no page overflow or page errors; reduced motion produces no active animations.

| Renderer / viewport / theme | Before | After |
|---|---|---|
| react / 390 / light | [Before](before/react-390-light.png) | [After](after/react-390-light.png) |
| react / 390 / dark | [Before](before/react-390-dark.png) | [After](after/react-390-dark.png) |
| react / 1440 / light | [Before](before/react-1440-light.png) | [After](after/react-1440-light.png) |
| react / 1440 / dark | [Before](before/react-1440-dark.png) | [After](after/react-1440-dark.png) |
| hono / 390 / light | [Before](before/hono-390-light.png) | [After](after/hono-390-light.png) |
| hono / 390 / dark | [Before](before/hono-390-dark.png) | [After](after/hono-390-dark.png) |
| hono / 1440 / light | [Before](before/hono-1440-light.png) | [After](after/hono-1440-light.png) |
| hono / 1440 / dark | [Before](before/hono-1440-dark.png) | [After](after/hono-1440-dark.png) |

[Baseline receipt](before/receipt.json), [changed receipt](after/receipt.json), [packed import receipt](package.json), [packed interaction/motion roles](roles.json).

The later branch update only merges the separately checked documentation simplification and adds this evidence. Runtime source and lockfile retain the checked inputs. Release identity is established by the subsequent registry tarball.
