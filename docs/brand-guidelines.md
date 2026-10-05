# Tangle Brand Guidelines

This repo is the source of truth for shared Tangle visual decisions. It should not become a gallery of every experiment. If a rule belongs across products, document it here; if it belongs to one product, keep it in that product.

Tangle has two core themes:

- **Dark** for the main site, product launches, product UI, and system diagrams.
- **Light** for blog, research, docs, and long-form editorial surfaces.

## Package Boundary

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

## Theme Contract and Authoring

Author shared decisions in Brand's `tokens.css`; named product overrides live in `named-themes.css`. `theme.css` registers that contract for Tailwind, including inline variable-dependent utilities and checked font/radius defaults. HSL channel aliases and full-color aliases are distinct public APIs; do not change their value formats or copy their palettes into app globals.

Brand stays dark-default. Explicit `.light` / `.dark` or `data-theme="light"` / `"dark"` boundaries must work on the document and in nested opposite-mode islands. The existing named families retain their palettes and mode names. Intelligence remains dark-only under `.dark[data-theme="intelligence"]`; switching to light keeps its identity and falls back to canonical light. Hospitality is a two-mode product theme on the document root: `[data-theme="hospitality"]` is its light ladder and `.dark[data-theme="hospitality"]` its dark one, so the shared mode control switches it without a second attribute. Existing legacy `vault` / `dawn` light markers remain supported, with an explicit `.dark` on the same element taking precedence. Do not author contradictory mode markers on one boundary.

The one light-default compatibility projection exists for Agent App's established default contract. Brand owns its generator, export and freshness check. Its values derive from canonical CSS, not from a maintained compatibility palette. It leaves the host's `--radius` alone. Importing it is an explicit consumer migration, not permission to layer it over another global theme system; component-specific consumer CSS still needs reconciliation. See [the package contract](../packages/brand/README.md#existing-light-default-consumers).

UI's root theme control must tolerate SSR and unavailable storage, update its resolved system preference, and preserve named product identities. Components consume semantic variables in their own scope; syntax highlighting must not sample document-root colors. A mode preference is not a product identity, and a nested explicit mode is not a request to change the whole document.

The optional `ladders.css` / `system.css` remain opt-in. This contract does not introduce a theme provider, a token DSL, or an automatic rollout of those styles. Shared motion variables do not apply animations by themselves and must respect reduced motion when consumed.

## Visual Direction

Indigo/purple is the interaction and brand accent. The canonical product surface ladder is neutral grey, with a dark canvas above pure black and light paper cards on a grey canvas. Named product themes may intentionally retint their surfaces; they are explicit opt-ins, not copies of a second global palette.

Use:

- Indigo, periwinkle, neutral surfaces, paper, and ink as the main brand range.
- Distinct surface planes with visible fill and border relationships.
- Smooth wave assets for hero, launch, and brand-system work.
- Light wave and paper assets for research pages and editorial graphics.
- Real product UI, trace diagrams, or screenshot composites when explaining the product.
- Large readable type, direct hierarchy, and restrained copy.

Avoid:

- Green as the production identity.
- Pure black as the default canvas.
- Tiny eyebrow labels above headings.
- Taxonomy chips as design.
- Traffic-light rows, fake status boards, and generic agent step cards as marketing graphics.
- Pages that are only text, chips, and cards.
- Labeling every internal repo or product at once.

## Color Roles

Product UI uses color for three separate jobs. A component picks one role and never borrows another role's color.

| Role | Job | Source | Rule |
| --- | --- | --- | --- |
| Brand | Identity and the primary action | The iris accent tokens | One primary action per view. |
| Category | Tell kinds of things apart: file types, entities, capabilities, chart series | Categorical tone families | Always paired with a label or icon. A category color never means success, failure, or progress. |
| Status | Report a state the product observed | Success, warning, danger, info, and neutral tones | Unknown or unrecorded states stay neutral. |

`packages/brand/scripts/gen-ladders.mjs` generates every tone family with matching background, border, text, and icon values in both themes; edit its map, not `system.css`.
The categorical set is violet, orange, teal, blue, pink, brown, cyan, and lime.
To paint an element with whichever category its data names, set `data-tone="<category>"` on it and read `--tone-bg`, `--tone-bg-hover`, `--tone-bg-selected`, `--tone-border`, `--tone-border-selected`, `--tone-text`, and `--tone-icon`.
Badge's `running`, `creating`, `stopped`, `warm`, `cold`, and `deleted` variants are sandbox lifecycle states; slice 1 moves them to `sandbox-ui` adapters over status tones.

Products do not paint states or categories with Tailwind palette utilities such as `bg-amber-500` or with hex literals. The consumer drift check counts both, and a consumer's count may only fall.

A customer or co-brand preset is a named theme in `named-themes.css`. It may change the logo, display name, and accent. It may not change what a status or category color means, and it is never a consumer-side stylesheet override.

## Theme Roles

Use **Dark** for:

- Homepage hero and primary product sections.
- Sandbox, Router, and Intelligence pages.
- Product screenshots, trace diagrams, and system architecture.
- Launch assets where Tangle needs to feel immediately recognizable.

Use **Light** for:

- Blog.
- Research.
- Docs.
- Long-form pages where reading comfort matters more than launch energy.

Do not present theme experiments in production pages. Put exploratory layouts, generated atmospheres, and rejected directions in scratch files until a direction is chosen.

## Product Hierarchy

The public site should lead with the product boundary:

- Sandbox.
- Router.
- Intelligence.

Open-source tools are supporting proof and adoption paths:

- `agent-eval`.
- `agent-runtime`.
- `agent-app`.
- `agent-sdk`.

Specialized agents are examples or later surfaces, not the top-level homepage hierarchy:

- `browser-agent`.
- `blueprint-agent`.
- `tax-agent`.
- `legal-agent`.
- `gtm-agent`.

Do not show all of this in one viewport. Each page section should make one decision easier.

## Copy Standard

Write for a serious venture-backed infrastructure company. Plain language is good; childish reduction is not.

Good copy:

- Names the product, value, or decision directly.
- Explains what changes for the buyer or builder.
- Uses proof, screenshots, diagrams, or artifacts to carry detail.
- Leaves breathing room.

Bad copy:

- Adds labels such as "platform loop," "open source substrate," or "proof over positioning."
- Explains obvious UI mechanics.
- Repeats internal taxonomy as if it were user value.
- Turns every section into a card grid.
- Adds CTAs before the page has earned them.

## Graphic Standard

Every major marketing or brand page needs a visual idea, not just layout.

Acceptable graphics:

- Generated brand atmospheres with deliberate crops.
- Product screenshots placed in realistic compositions.
- Trace diagrams that show real data flow.
- Model-routing diagrams with real providers and product boundaries.
- Research figures that clarify an argument.

Weak graphics:

- Generic abstract gradients without brand control.
- Icon rows with short labels.
- Status rows pretending to be product proof.
- Decorative cards that contain only copy.

## Component Standard

Only document or showcase components that should influence product design. A component is approved when at least one real app consumes it and the story demonstrates a real state.

For run and tool UI:

- Prefer one canonical row implementation.
- Keep adapter exports only when consumers still need migration time.
- Do not teach uppercase status pills, step labels, or traffic-light rows as a brand pattern.
- Stories should show real transcript states, not fake process theater.

## Review Checklist

Before a brand, marketing, or component PR merges:

- The first viewport has no tiny eyebrow label.
- Indigo accents and dark product surfaces remain the production mood unless the surface is explicitly editorial.
- The page has a real visual asset, diagram, screenshot, or composition.
- Product hierarchy does not mix products, open-source tools, and example agents at equal weight.
- Component stories do not create new visual precedent for stale UI.
- Any new token has a cross-app reason.
- Any new reusable component has at least one consuming product or a named migration target.
- Token changes regenerate the compatibility stylesheet and pass its generation check; mode changes are exercised in nested and named scopes.
