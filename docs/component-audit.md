# Component Audit

This document tracks what in `@tangle-network/ui` is canonical, adapter-only, or suspect. The goal is to keep the package useful without letting old demo UI become the brand.

## Current Judgment

`RunGroup` and `InlineToolItem` are the useful center of the run UI. They model real agent transcript states and are referenced by product work. `ToolCallStep` is an internal-only adapter (no longer exported); `ToolCallFeed` remains public while `tax-agent` imports it.

`ChatInput` is deleted. `ChatContainer` is transcript-only — the canonical composer is `AgentComposer` in `@tangle-network/sandbox-ui`, composed below the transcript by the app (the pattern `AgentWorkspace` in sandbox-web already uses). The composer stack stays in sandbox-ui because it is agent-domain (depends on `@tangle-network/agent-interface`, harness/model pickers, provider logos); `@tangle-network/ui` stays the generic layer.

## Keep

`packages/ui/src/run/run-group.tsx`

- Keep as the transcript container.
- It should render agent output, tool calls, reasoning, OpenUI artifacts, and collapsed summaries.
- Remove decorative avatar/status treatments when they do not carry useful state.

`packages/ui/src/run/inline-tool-item.tsx`

- Keep as the canonical tool-call row.
- It can show icon, title, detail, duration, status, expansion, and actions.
- It should avoid loud uppercase pills except for true error or running states where the status is necessary.

`packages/ui/src/chat/chat-message.tsx`

- Keep if it remains a simple message bubble primitive.
- Sender labels are acceptable as actual chat metadata, but should not use marketing-style uppercase tracking.

## Adapter-Only

`packages/ui/src/run/tool-call-step.tsx`

- Internal adapter mapping flat `label/status/detail/output` props into `InlineToolItem` for `AgentTimeline` and `ToolCallFeed`.
- Not exported; only the `ToolCallType`/`ToolCallStatus` types are public (referenced by `ToolCallData`).
- Do not expand it into another bespoke row.

`packages/ui/src/run/tool-call-feed.tsx`

- Public while `tax-agent` imports it (`session-vault.tsx`).
- When tax-agent migrates to `AgentTimeline`/`RunGroup`, delete the feed and fold `ToolCallType`/`ToolCallStatus` into it.

## Suspect Story Patterns

`packages/ui/src/run/tool-call-step.stories.tsx`

- Shows grouped phase labels such as "Exploration" and "Test cycle."
- Shows all tool types as a taxonomy panel.
- Removed from Storybook. Keep the source adapter only while consumers still import it.

`packages/ui/src/run/tool-call-feed.stories.tsx`

- Removed from Storybook. The `ToolCallFeed` source stays because `tax-agent` still imports it.

`packages/ui/src/stories/theme-showcase.stories.tsx`

- Useful for token testing; it now uses `InlineToolItem` instead of hand-rolled rows.
- The theme names and green "Arena" direction should not imply a production site identity.

## Deletion Gate

Before deleting a public export:

1. Search active repos for imports:

   ```sh
   rg -n "ToolCallStep|ToolCallFeed|InlineToolItem|RunGroup" ~/webb -g '!**/node_modules/**' -g '!**/dist/**'
   ```

2. Migrate active first-party consumers to `RunGroup` or `InlineToolItem`.
3. Remove adapter stories first, then adapter exports in the next breaking release.
4. Add a changeset when package exports change.

## Immediate Cleanup Targets

- Migrate `tax-agent` from `ToolCallFeed` if we want to remove that export.
- Replace `AgentTimeline` internals with `InlineToolItem` directly if we want to remove the `ToolCallStep` adapter.
- Remove adapter exports in a breaking-release PR after consumers migrate.

## Generic page presentation (scope 6.B)

### Canonical ownership and source

`packages/ui/src/primitives/heading.tsx` is the shared title renderer used by
`PageHeader` and `CardTitle`. Its six visual roles, token references, literal
fallbacks and default semantic tags are ported from
`tangle-network/sandbox-ui/src/primitives/heading.tsx` at
`2b0f8c3997e53176d34d077d37277a144dc6c8a2`. They use the existing Brand scale;
no typography tokens or competing status/metric/toolbar components are added.

`page-shell.tsx` is ported from the same Sandbox commit's
`src/primitives/page-shell.tsx`, retaining `children`, `className`, max-width,
gutters and vertical rhythm, with `min-w-0` for constrained parents. It is an
optional spacing primitive, not an app shell: it does not choose a landmark,
route, auth boundary, sidebar, loading strategy, or grid. Apps own those
choices. A workbench can omit it or override the width/alignment with
`className="mx-0 max-w-none"`; it must not be forced into centered cards.

This is library consolidation, not a Sandbox or application rollout. The
existing Sandbox exports are not deleted or changed here. A consuming change
can map/re-export its existing contracts onto these maintained primitives
without copying another implementation.

### Contracts and the only compatibility mappings

- `Heading variant` selects the visual role; `as` selects the semantic element
  independently. Default tags remain display/page → h1, hero/section → h2,
  subsection → h3, eyebrow → p. Use one page h1 and explicit levels for nested
  content. Sandbox's existing six `role` values remain accepted as visual
  inputs, never emitted as invalid ARIA roles. `variant` wins if both are
  supplied. Other native ARIA roles still pass through.
- `PageHeader` preserves `actions`, `meta`, `titleId`, `level`, its header ref
  and HTML attributes. Existing Sandbox `action`, `eyebrow`, `titleAs` inputs
  use the same renderer. `actions` wins when it is not undefined, including
  explicit null. `titleAs` wins over the element selected by `level`, but does
  not change its visual treatment. `level={2}` retains a nested h2/section
  treatment. Description and eyebrow remain outside the title. Numeric zero
  is not treated as missing metadata.
- Titles can wrap unbroken identifiers; action groups wrap and shrink without
  truncating the title. A control still owns its own sizing: for a multi-line
  Button label use `className="h-auto whitespace-normal"`, as in the narrow
  story, rather than overriding all action sizes inside the header.
- `CardTitle` keeps h3 and `HTMLHeadingElement` refs by default, and supports
  `as="h1"` through `as="h6"` for the actual hierarchy. Its visual treatment
  is Heading's subsection role regardless of tag. Card parts share `p-4`;
  body/footer remove top padding only when not the first child, so content-only
  cards retain their inset. `hover` is decorative border feedback: it creates
  no pointer cursor, role, focus stop or keyboard handler. Compose a native
  button/link for actions; do not build an inaccessible clickable div.
- `Table` keeps the native table ref/attributes and default scroll wrapper.
  `wrapperProps` configures that wrapper's accessible name, role, tabIndex,
  classes and handlers independently of the table. Use a named, focusable
  region for overflowing tables. `wrapper={false}` returns only the native
  table for a caller-owned scroller (wrapper props are then ignored, not leaked
  onto the table). Captions, sections, header scopes and cells remain native;
  no grid role, nested scroller or universal extra tab stop is imposed.

`StatusPill`, `MetricStrip`, `Metric`, `Toolbar` and `FilterField` remain the
existing implementations and exports. The new page stories compose them;
there is no second status, statistics or toolbar API.

### Regression and browser acceptance surfaces

The existing PageHeader tests are retained and extended. New Heading, Card,
Table and PageShell tests cover semantic levels, refs/attributes, compatibility
precedence, label separation, padding class contracts, native table structure,
wrapper ownership and native-button keyboard activation. jsdom does not prove
computed layout; class assertions are not presented as browser evidence.

Storybook adds `Primitives/Heading`, `Primitives/PageHeader`,
`Primitives/PageShell`, `Primitives/Card/Anatomy` and
`Primitives/Table/Wrapper`, without removing existing Card/Table stories.
PageShell shows populated, empty, loading and error states. Search can produce
an empty result set; clear-search and retry/add-example actions update real
local state. Missing/loading/error data is shown as unknown, not invented zero
metrics. All data is explicitly example data; no backend integration is claimed.

The hierarchy, narrow-header, card-anatomy and two table-wrapper stories have
browser `play` assertions. They fail on heading-order drift, narrow overflow,
clipped action labels, inconsistent computed card padding, missing standalone
padding, nested scroll containers or a non-focusable/non-scrolling owner.
Opening those stories executes the assertions; `build-storybook` alone does not.
Also inspect at 320/390/1280px in both themes, tab through card actions and table
regions, use Enter/Space on the button and arrow keys in the table, and inspect
the native accessibility tree. Do not claim screen-reader or browser acceptance
from an unexecuted story or a successful build.
