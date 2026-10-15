# Brand guidelines

Read the [Tangle design bible](design-bible.md) first for shared principles, visual direction, copy, graphics, motion, interaction and acceptance. This page retains implementation contracts.

## Package boundary

`@tangle-network/brand` owns:

- Logo and knot usage.
- Color, type, radius, motion, shadow, status, and semantic CSS tokens.
- Theme contracts for dark, light, and product-specific surfaces.
- Brand assets and guidance for generated atmospheres, diagrams, and editorial imagery.

`@tangle-network/ui` owns:

- Reusable React primitives and product components.
- Chat, run, file, editor, auth, markdown, and tool-preview components that are actively consumed by apps.
- Storybook examples that demonstrate real product states, not decorative marketing rows.

Consumer apps own:

- Product-specific composition.
- Screenshots, demos, and diagrams using real UI and real data.
- Page-level copy, navigation, and product hierarchy.

## Theme contract and authoring

Author shared decisions in Brand's `tokens.css`; named product overrides live in `named-themes.css`. `theme.css` registers that contract for Tailwind, including inline variable-dependent utilities and checked font/radius defaults. HSL channel aliases and full-color aliases are distinct public APIs; do not change their value formats or copy their palettes into app globals.

Brand stays dark-default. Explicit `.light` / `.dark` or `data-theme="light"` / `"dark"` boundaries must work on the document and in nested opposite-mode islands. The existing named families retain their palettes and mode names. Intelligence remains dark-only under `.dark[data-theme="intelligence"]`; switching to light keeps its identity and falls back to canonical light. Hospitality is a two-mode product theme on the document root: `[data-theme="hospitality"]` is its light ladder and `.dark[data-theme="hospitality"]` its dark one, so the shared mode control switches it without a second attribute. Existing legacy `vault` / `dawn` light markers remain supported, with an explicit `.dark` on the same element taking precedence. Do not author contradictory mode markers on one boundary.

The one light-default compatibility projection exists for Agent App's established default contract. Brand owns its generator, export and freshness check. Its values derive from canonical CSS, not from a maintained compatibility palette. It leaves the host's `--radius` alone. Importing it is an explicit consumer migration, not permission to layer it over another global theme system; component-specific consumer CSS still needs reconciliation. See [the package contract](../packages/brand/README.md#existing-light-default-consumers).

UI's root theme control must tolerate SSR and unavailable storage, update its resolved system preference, and preserve named product identities. Components consume semantic variables in their own scope; syntax highlighting must not sample document-root colors. A mode preference is not a product identity, and a nested explicit mode is not a request to change the whole document.

The optional `ladders.css` / `system.css` remain opt-in. This contract does not introduce a theme provider, a token DSL, or an automatic rollout of those styles. Shared motion variables do not apply animations by themselves and must respect reduced motion when consumed.

## Color roles

Product UI uses color for three separate jobs. A component picks one role and never borrows another role's color.

| Role | Job | Source | Rule |
| --- | --- | --- | --- |
| Brand | Identity and the primary action | The iris accent tokens | See [action priority](design-bible.md#theory). |
| Category | Tell kinds of things apart: file types, entities, capabilities, chart series | Categorical tone families | Always paired with a label or icon. A category color never means success, failure, or progress. |
| Status | Report a state the product observed | Success, warning, danger, info, and neutral tones | Unknown or unrecorded states stay neutral. |

`packages/brand/scripts/gen-ladders.mjs` generates every tone family with matching background, border, text, and icon values in both themes; edit its map, not `system.css`.
The categorical set is violet, orange, teal, blue, pink, brown, cyan, and lime.
To paint an element with whichever category its data names, set `data-tone="<category>"` on it and read `--tone-bg`, `--tone-bg-hover`, `--tone-bg-selected`, `--tone-border`, `--tone-border-selected`, `--tone-text`, and `--tone-icon`.
Badge's `running`, `creating`, `stopped`, `warm`, `cold`, and `deleted` variants are sandbox lifecycle states; slice 1 moves them to `sandbox-ui` adapters over status tones.

Dim the page behind a modal or sheet, or a photo under its caption, with `--scrim` (or `--scrim-strong` for a caption gradient), and set text on a photo or scrim in `--on-media`. Both stay the same in every theme; products do not write `black` or `white` for them.

Products do not paint states or categories with Tailwind palette utilities such as `bg-amber-500` or with hex literals. The consumer drift check counts both, and a consumer's count may only fall.

A customer or co-brand preset is a named theme in `named-themes.css`. It may change the logo, display name, and accent. It may not change what a status or category color means, and it is never a consumer-side stylesheet override.

## Policy index

### Visual direction

See the [design bible](design-bible.md#visual-grammar).

### Theme roles

See the [design bible](design-bible.md#theme-roles).

### Product hierarchy

See the [design bible](design-bible.md#product-hierarchy).

### Copy standard

See the [design bible](design-bible.md#copy-standard).

### Graphic standard

See the [design bible](design-bible.md#graphic-standard).

### Component standard

See the [design bible](design-bible.md#component-standard).

### Review checklist

See the [design bible](design-bible.md#shared-review-requirements).
