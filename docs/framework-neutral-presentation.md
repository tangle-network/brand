# Shared React and Hono presentation

Brand owns palette, type, effects and canonical knot. UI owns generic presentation.
Router keeps Hono; Sandbox and Platform keep React. Consumer adapters own markup,
route data, IDs, ARIA relationships and event registration, never copied style values.

Import Brand styles first, then `@tangle-network/ui/styles/presentation.css`.
Tailwind consumers scan `@tangle-network/ui/src` (including `presentation.ts`) in
addition to application source. The UI `presentation` entry is React-free and safe
on the server: DOM APIs are used only when its event binding is called in a browser.

| Role | React owner, exported from `@tangle-network/ui/primitives` | Hono owner, exported from `@tangle-network/ui/presentation` | Adoption deletion |
| --- | --- | --- | --- |
| Type and page heading | `Heading`, `PageHeader` with `presentation` | Brand `tangle-display`; UI `tangle-heading` and `tangle-page-header` | Local h1/type classes |
| Display CTA | `Button size="display"` | `buttonVariants({size:"display"})`, matching `data-variant` | Local CTA sizing |
| Reading frame | `PageShell navigation article outline` slots | `tangle-reading-shell`, `tangle-reading-nav`, `tangle-reading-article`, `tangle-reading-outline` | Local docs grid/width styles |
| Field and native select | `Input`, `Textarea`, `SelectTrigger` | `inputVariants`, `fieldPresentation`, `fieldSizes`, `fieldTouchText`; native select uses field classes | Local field fills/sizes/focus |
| Table | `Table` family | `tablePresentation` named parts | Generic table styling; retain table data |
| Dialog | `Dialog`/`Sheet` (Radix) | `dialogPresentation` parts; `tangle-native-dialog`, `bindDialog` for native dialog | Local modal styles and handwritten focus traps |
| Metrics | `MetricStrip`, `Metric` | `metricPresentation`, `metricLayouts` | Local metric grids/typography; retain data source |
| Empty state | `EmptyState` | `emptyStatePresentation` named parts | Local generic empty-state definitions |
| Code, copy and API blocks | Canonical `markdown/CodeBlock`, forwarded by primitives | B3 owns the separate code contract | Adoption waits for B3 release |

React primitives read the same named class definitions as Hono. `presentation` is
an explicit opt-in for Heading and PageHeader; their prior default output remains.
PageShell retains its original no-slot layout. It does not invent routes, search,
authentication or content. Native headings and nav/aside landmarks remain explicit.

For Hono, render an accessible native `dialog` with `class="tangle-native-dialog"`,
a unique ID and `aria-labelledby` pointing to its title. Register
`bindDialog(dialog, trigger)` once on mount and call the returned cleanup on removal.
Use `data-dialog-close` on close actions. Native modal behavior owns focus containment
and Escape; the shared binding returns focus and updates the trigger's expanded state.
React may also use this native adapter; existing Dialog/Sheet keep Radix ownership.
Native select options and validation stay browser-owned. A consumer that requires a
custom select must preserve the established accessible combobox contract.

Duplicate counts are scoped to migrated roles. Hono fixtures contain markup and
bindings only: no copied primitive classes or palette/size declarations. Downstream
lanes record the exact deleted paths; no downstream application is declared adopted
by this package release.
