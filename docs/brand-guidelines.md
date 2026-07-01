# Tangle Brand Guidelines

This repo is the source of truth for shared Tangle visual decisions. It should not become a gallery of every experiment. If a rule belongs across products, document it here; if it belongs to one product, keep it in that product.

Tangle has two core themes:

- **Dark** for the main site, product launches, product UI, and system diagrams.
- **Light** for blog, research, docs, and long-form editorial surfaces.

## Package Boundary

`@tangle-network/brand` owns:

- Logo and knot usage.
- Color, type, radius, shadow, status, and semantic CSS tokens.
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

## Visual Direction

Purple is the production identity. Dark surfaces carry the main product story. Light surfaces carry reading, research, docs, and quieter reference material.

Dark means deep violet/navy, not black. Pure black should be reserved for depth accents, image contrast, or rare technical surfaces where the content needs it.

Use:

- Deep violet, indigo, periwinkle, paper, and ink as the main brand range.
- A dark surface ladder with visible purple/navy temperature.
- Smooth wave assets for hero, launch, and brand-system work.
- Light wave and paper assets for research pages and editorial graphics.
- Real product UI, trace diagrams, or screenshot composites when explaining the product.
- Large readable type, direct hierarchy, and restrained copy.

Avoid:

- Green as the production identity.
- Near-black as the default canvas.
- Tiny eyebrow labels above headings.
- Taxonomy chips as design.
- Traffic-light rows, fake status boards, and generic agent step cards as marketing graphics.
- Pages that are only text, chips, and cards.
- Labeling every internal repo or product at once.

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
- Purple/dark remains the production mood unless the surface is explicitly editorial.
- The page has a real visual asset, diagram, screenshot, or composition.
- Product hierarchy does not mix products, open-source tools, and example agents at equal weight.
- Component stories do not create new visual precedent for stale UI.
- Any new token has a cross-app reason.
- Any new reusable component has at least one consuming product or a named migration target.
