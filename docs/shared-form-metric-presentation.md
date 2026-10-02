# Shared form and metric presentation

Base inspected: `main` at `6fc2fe4cd5579caf67019e17381104cc795d3e90`.
This is a UI presentation change, not a new form, layout, theme, or data system.

## Ranked options and chosen batch

| Rank | Option | User value / correctness / consolidation | Dependency and risk | Decision |
| --- | --- | --- | --- | --- |
| 1 | Reuse the actual field-well token and explicit field ink | High: fields no longer look like raised cards; never confuse a fill with a border/track | Existing Brand token definitions first; low risk, caller classes still win | Included |
| 2 | Correct action ink and duration types | High: readable links and a transition duration the browser actually accepts | Existing accent and duration vocabulary; low risk, no palette rewrite | Included |
| 3 | Give MetricStrip one owner for grid and separators | High: fixes the split responsibility that forces consumers to synchronize two components | Caller inventory first; medium risk at responsive boundaries | Included |
| 4 | Add explicit compact/touch sizing rather than change defaults | High: mixed-control rows can align without inflating dense consumers | Existing density token and native props; low risk, additive variants | Included |
| 5 | Make long metric content and zero qualifiers readable | High: touch users need the full reading; zero is data, not absence or alarm | Preserve dt/dd, padding and existing attention contract; low/medium visual risk for long rows | Included |
| 6 | Extend maintained packed and browser checks | High correctness leverage without another build/install framework | Depends on 1–5; medium infrastructure risk, results must distinguish runtime from CSS-only evidence | Included |
| 7 | Remove application-specific metric overrides and roll out packages | Useful consolidation, but only after the tested artifact is published and applications adopt it | Separate consumer/release owners; high risk to unrelated publication cuts | Deferred; not claimed as this library delivery |

Implementation order was token/caller inspection, shared control presentation,
MetricStrip ownership, then focused checks. Automatic child counting, responsive
prop maps, observers and a universal layout API were rejected: a finite scalar
`columns` contract is sufficient, and does not change when data is unknown.

## Public contracts

`Input`, `Textarea`, `SelectTrigger`, `Button`, `MetricStrip` and `Metric` retain
their existing public exports. Existing props and native refs remain supported.
No new package entry or dependency is introduced.

Fields use `bg-[var(--bg-input)]`, not `bg-input` and not `bg-card`.
Brand's `--input` / Tailwind `--color-input` is the shadcn border/off-track role;
`--bg-input` is the recessed fill. The established `focusField` resting hairline,
hover border, focus border/halo and invalid palette remain in use. Explicit
`aria-invalid` receives the same invalid presentation as the existing error prop.
Foreground and autofill ink resolve in the local scope. Autofill uses an inset
shadow alongside the focus ring, not an arbitrarily long transition that hides
state changes. Native autocomplete attributes and values are not rewritten.

`--duration-fast` supplies a time and `--ease-standard` supplies easing.
`--transition-fast` remains unchanged for consumers that correctly use it as a
shorthand. Button no longer puts that shorthand into `transition-duration`, or
transitions every property. Color, border, shadow, transform and the individual
`scale` property are explicit. Reduced motion disables duration/transition and
retains the existing spinner/active-scale reductions. Link buttons use accent
**ink**, while filled buttons retain their existing foregrounds.

| Control | Existing default retained | Explicit compact | Explicit touch |
| --- | --- | --- | --- |
| Input | 44px; sm 36px, lg 48px unchanged | `--control-height`, 36px by default | At least 44px, 16px text |
| SelectTrigger | 36px | `--control-height` | At least 44px, 16px text |
| Button | `--control-height`; sm/lg/xl/icon unchanged | `--control-height` | At least 44px, 16px text |
| Textarea | Minimum 120px, vertically resizable | Minimum 96px, compact padding | Minimum 120px, 16px text |

A consumer can keep `--control-height: 32px` without shrinking touch controls.
Caller class overrides still pass through the existing `cn` merge. Long action
labels can keep the existing `className="h-auto max-w-full whitespace-normal"`
escape; a globally taller default or a new wrapping prop is unnecessary.

| MetricStrip columns | Below sm | sm to below lg | lg and above |
| --- | --- | --- | --- |
| Omitted / 4 | 2 | 4 | 4 |
| 3 | 2 | 3 | 3 |
| 5 | 2 | 3 | 5 |
| 6 | 2 | 3 | 6 |

Each literal preset declares both the grid and matching direct-child separators
in disjoint ranges. Metric no longer contains any breakpoint or nth-child border
logic. Native `dl > div > dt/dd`, item padding and short-value typography remain.
Long labels, values and hints wrap without requiring a mouse-only title; existing
string value/hint titles are retained. A numeric-zero hint is a real `dd`, rather
than a loose text node. Null, missing and false hints remain absent. Values are
not formatted, converted to zero, or used to infer attention.

## Caller inventory and deletion boundary

At Platform `6bd025ec50c6cc5600630af876ef90acbb17528f`:

- `products/platform/web/src/client/components/dashboard/DashboardStats.tsx`
  uses the default four-reading strip and its own loading skeleton. The default
  two/sm:four grid is retained; no loading/controller rewrite is needed.
- `products/platform/web/src/client/components/UsageSummary.tsx` uses three
  readings and explicit mobile first-item span / important border overrides.
  These overrides remain supported and are demonstrated in the browser story.
  After adoption, `columns={3}` can replace its desktop grid override; its custom
  leading mobile composition remains a consumer escape, not a silently changed
  default. No downstream override was deleted in this PR.

Brand's existing page-shell story uses the default strip. Sandbox UI's public
compatibility imports remain valid. The independent dapp metric renderer is not
this API and was not replaced. Only Metric's competing separator implementation
was removed after this inventory. Three-to-six examples in the new stories are
explicit synthetic presentation fixtures, not claimed live application data.

## Prior delivery and release coordination

The merged accessibility work (#191), canonical page work (#190), scoped theme
work (#192), Dialog (#198), Charts and CodeBlock/import-boundary work are not
rewritten. In particular, Button's activation/Slot implementation and the
Select content/item implementation are byte-identical to the inspected base.
Existing Input/Button accessibility tests stay unchanged. Prior results cover
unchanged behavior only; they are not represented as tests of this new head.
Existing page/theme screenshot directories remain untouched.

The inspected package versions are UI 11.14.0 and Brand 1.10.0. The required
fill/accent/duration tokens already exist at that Brand peer floor. This PR adds
one **UI minor changeset**, no hand-written version bump, Brand change, lockfile
change, workflow edit or publish action. The maintained Changesets publisher owns
the next version/artifact. The open unrelated transcript PR #200 and other
publishers' work are not edited or prerequisites to opening this PR.

## Focused validation

On the maintained Node/pnpm toolchain, run from repository root:

```sh
pnpm install --frozen-lockfile
pnpm exec vitest run packages/ui/src/primitives/input.test.tsx packages/ui/src/primitives/button.test.tsx packages/ui/src/primitives/control-presentation.test.tsx packages/ui/src/primitives/metric-strip.test.tsx
pnpm typecheck
pnpm build
node scripts/package-smoke.mjs packages/ui
pnpm build-storybook
# Serve the generated Storybook through the existing development environment,
# then, with Python Playwright and Chromium available:
python scripts/ui-presentation-browser-proof.py http://127.0.0.1:6006 /tmp/ui-presentation-proof
```

The existing packed runtime fixture now also renders sized fields, pending
buttons, SelectTrigger and every metric preset through installed public exports.
Its existing import-graph measurement fixtures and default comparison logic are
unchanged. The focused browser script uses the existing Storybook and Python
Playwright pattern: computed fills/ink/heights/timings, density override, long
content, nested modes, real Radix keyboard/touch interaction, pending behavior,
forced-autofill paint, reduced motion and breakpoint separators. It writes a
failure receipt on error and never treats a forced pseudo-state as native saved-
profile autofill evidence. It awaits finite transitions, not the pending spinner.

Observed in this execution:

- Nine TS/TSX files passed TypeScript 5.8.3 syntax and isolated transpilation;
  this is **not** the repository TypeScript 7 semantic typecheck. The packed
  runtime script passed Node syntax checking; the browser script passed Python
  compilation. Byte equality of the preserved Button/Select behavior was checked.
- A supplementary **native-DOM CSS-only** probe passed 390/1280px light/dark
  cases and 16 breakpoint/preset cases at 639, 640, 1023 and 1024px. It used
  Tailwind 4.1.10, Chromium 144.0.7559.96, literal changed utility candidates and
  a copied subset of unchanged Brand tokens. It is not the repository's 4.3.3
  build, actual React components, Radix, full theme cascade or packed consumer.
  Resting fills measured rgb(31,31,31) dark / rgb(245,245,245) light; durations
  measured 0.15s versus the old invalid shorthand's 0s. Compact/touch heights,
  no text overflow, separators, local nested fills, forced-autofill ink/inset
  paint and reduced-motion zero duration were checked. Four screenshots are
  retained with the accompanying conversation evidence archive and their hashes
  in the receipt. The phone-dark and desktop-light screenshots were inspected.
- Local Git failed with `Could not resolve host: github.com`; the authorized
  GitHub branch/tree/commit/PR path is used instead. Offline Vitest availability
  failed with `ENOTCACHED` for `https://registry.npmjs.org/vitest`. pnpm and the
  repository dependencies are unavailable; local Node 22.16.0 is below the
  declared 22.22.2 floor. Repository tests/build/packed smoke did not run.
- Actual Storybook browser navigation was attempted and returned
  `Page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR` for the local Storybook iframe.
  Local-file navigation was also blocked. No browser policy was changed;
  the independent generated CSS probe ran only through in-memory markup.
  No Storybook interaction pass or screenshot is claimed.

See [the scoped receipt](evidence/shared-form-metric/receipt.json). Main #202
removed automatic PR CI; this PR does not restore it or claim a hosted green run.

## Remaining owners and gates

Brand maintainers own the unrun full-toolchain unit/type/build/packed/Storybook
checks and review before merge. The UI publisher owns version assignment,
registry artifact verification and release; no public release is claimed here.
Platform owns dependency adoption and the usage-summary override migration.
Sandbox UI's compatibility/publishing owner owns adoption without changing an
already-frozen publication cut. Application QA owns live served-page proof,
real devices, native saved-profile autofill, WebKit/Firefox and screen-reader
verification. Existing Select portal behavior is unchanged, not broadened into
a theme-context system. Library source delivery is not consumer/public/live
rollout, and the supplemental CSS screenshots do not close those gaps.
