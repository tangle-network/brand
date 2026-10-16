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
| Field and native select | `Input`, `Textarea`, `SelectTrigger` | `inputVariants`, `labelVariants`, `helpPresentation`, `fieldPresentation`, `fieldSizes`, `fieldTouchText`; native select uses field classes | Local field fills/sizes/focus |
| Table | `Table` family | `tablePresentation` named parts | Generic table styling; retain table data |
| Dialog | `Dialog`/`Sheet` (Radix) | `dialogPresentation` parts; `tangle-native-dialog`, `bindDialog` for native dialog | Local modal styles and handwritten focus traps |
| Metrics | `MetricStrip`, `Metric` | `metricPresentation`, `metricLayouts` | Local metric grids/typography; retain data source |
| Empty state | `EmptyState` | `emptyStatePresentation` named parts | Local generic empty-state definitions |
| Code, copy and API blocks | Canonical `markdown/CodeBlock`, forwarded by primitives | `@tangle-network/ui/code-presentation` owns the shared code contract | Local code/highlighting/copy/tab implementations |

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

## Code and API presentation

`@tangle-network/ui/code-presentation` exports `highlightCode`, `codePresentation`,
`codePreStyle`, `codeTextStyle`, `bindCopyButton`, `bindCodeTabs`, `schemaRows`,
`apiMetadataText` and their metadata types. It imports no React runtime. Highlighting
uses the existing lazy Shiki grammar owner and Brand syntax tokens; unsupported
languages remain readable plain text. A failed grammar download must leave the
consumer's escaped plain code in place.

React `CodeBlock` keeps its existing props. Supply `examples` for roving-keyboard
language tabs and automatic exact-copy controls for the active example. `metadata`
adds request, response or error context with optional method, status and content type.
The existing `code` prop remains the plain fallback; tabs never send requests.
`ApiSchema` is exported from `@tangle-network/ui/markdown`; schema values belong to
the consumer, not the design package.

Hono calls `highlightCode(code, language)` on the server or client and renders the
returned token content as escaped JSX text with its shared style object. Use the
published root/header classes and pre/code styles. Mark the scrollable pre as a
named `role="region"` with `tabindex="0"`. Register `bindCopyButton(button,status,
getExactText)` with a `role="status" aria-live="polite"` region. It shares ordering,
announcements and cleanup with React; failed clipboard writes remain visible.

For tabs, render a named tablist with uniquely identified buttons, one roving tab
stop, aria-selected and aria-controls relationships to tabpanels. Register
`bindCodeTabs(tablist)` and retain its cleanup. React uses this same event owner.
Content types distinguish JSON, SSE and binary descriptions; binary bytes are never
silently decoded or represented as JSON. Use literal provided strings for copy,
including trailing newlines. Render `schemaRows` as escaped definition-list content.

`CopyButton` also accepts a visible `label` (for example, "Copy all commands"),
`copiedLabel`, `failedLabel`, native button attributes and `className`. Omit `label`
to retain the icon-only control. The shared clipboard owner uses a selection-
preserving native copy fallback only when the Clipboard API is unavailable;
permission rejection remains a visible failure, with no repeated permission attempt.
## Existing application selectors

Platform can import `@tangle-network/ui/styles/compat.css` after Brand and Tailwind
instead of changing every `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`,
`.input`, `.card`, `.stat-card`, `.table-header` and `.table-cell` caller. This is an
explicit opt-in Tailwind stylesheet generated from the same primitive class owners,
not a second palette or hand-copied component style. Delete the replaced local
selector definitions. Cards should carry `data-slot="card"` where nested surface
rebinding matters. The aliases adopt shared default sizing and surface behavior.

`StatusPill` accepts a decorative `icon` slot and `tone="violet"` using Brand's
existing matched violet surface tokens; visible status text is always required.

## Segmented controls and section navigation

`tabsPresentation.list` and `tabsPresentation.trigger` expose the existing Tabs
owner's `default`, `pills` and `underline` classes through `@tangle-network/ui/presentation`.
React TabsList/TabsTrigger use those same definitions. Hono actual tabs retain
proper tablist/tab/tabpanel relationships, `aria-selected` and roving focus; match
`data-state="active"` or `"inactive"` for the shared selection styles. B3's
`bindCodeTabs` owns the generic native keyboard/selection binding for tab panels.
A segmented action without panels is a button group with `aria-pressed`; the
exported `ixSelected` and `ixControlSoft` own those states, without inventing tabs.

Section links use `tangle-reading-nav` / `tangle-reading-outline` and `aria-current`.
Routes, link destinations, form submission and persistence remain consumer-owned.
Button sizes use `buttonVariants({size:"sm"|"lg"})`; fields use `labelVariants` and
`helpPresentation`; tables use `tablePresentation`; panels use `cardPresentation`.
Delete the local classes as each corresponding caller migrates.

Display and operational controls (including `Button variant="bare"`), fields and table hover consume Brand’s `--motion-control`; reduced motion removes their transitions. The optional hero entrance consumes `--motion-arrive`. The shared hero has no ambient knot loop. Skeletons render a still placeholder under reduced motion.

React Dialog, Sheet, Popover and Tooltip retain Radix state, refs, focus and dismissal.
Their shared adapter uses Motion physics springs to retarget current geometry
and velocity. It derives a critically damped response from the resolved, scoped
surface/dismiss role duration. Brand's nonvisual CSS presence markers retain the
Radix lifecycle; they are distinct from the visual spring trajectory. Reduced
motion settles both paths, including a preference change while open. Application
state and focus never wait for a JavaScript animation callback. The native-dialog
adapter remains the Hono semantics owner; it wraps keyboard boundaries and
returns focus on close.

### Clipboard pending state

`createCopyFeedback` and `bindCopyButton` accept one write until the browser settles it. The React CopyButton uses that same controller. The controller reads scoped Brand `--interaction-*` roles from the button, resolving CSS durations into milliseconds; it never copies their values. Pending and duplicate-write suppression begin synchronously. The contextual ellipsis appears at the pending delay. At the long-work delay, the shared status reports elapsed time, unknown remaining time and that an accepted clipboard write cannot be cancelled. Success requires browser confirmation. Disposal suppresses later updates without claiming cancellation.

Use `codePresentation.copy` on native copy buttons and `codePresentation.copyStatus` on the live status element. Reduced motion uses the same static indicator. The optional settlement `measurement` reports elapsed/feedback milliseconds, the resolved budgets and whether the local mutation exceeded its budget; missing CSS roles remain unknown. Consumers retain ownership of external operation identity, cancellation acknowledgment and reconciliation.

The shared surface owner retains explicit [Motion values](https://motion.dev/docs/animate#motion-values) for opacity and geometry and binds them with [styleEffect](https://motion.dev/docs/style-effect). Reversal retargets those values on one frame clock; no channel starts from a separately sampled compositor animation. Reduced motion settles the same values synchronously.
