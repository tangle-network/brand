# Tangle product design refresh

Delivery brief, updated 2026-10-17. Tracks [#384](https://github.com/tangle-network/brand/issues/384). The [design bible](design-bible.md) owns shared vision and creation principles, [Brand guidelines](brand-guidelines.md) own visual implementation guidance, and the [evidence contract](design-evidence-contract.md) owns verification. This brief applies those sources to concrete journeys; it is not a second palette or component library. Product positioning stays in the relevant product.

## Why this work exists

Founder and prospect feedback describes a fragmented, template-like experience despite useful components. Treat this as a product-quality problem, not a request for more gradients, softer corners, or a new logo. A component can satisfy tokens while its page has weak hierarchy, vague copy, awkward navigation, or an unfinished task flow. The deliverable is a recognizable, useful experience that survives real content and interaction.

The existing rules already ask for indigo/periwinkle identity, real visual material, restrained copy, semantic colors, and no generic status-card theater. Preserve those strengths. Investigate composition, behavior, consumer adoption and inconsistent product decisions before adding more rules.

## Design direction to explore

**A research and engineering studio with a clear customer-facing purpose.** Keep Tangle's knot, indigo/periwinkle accents and established dark/light semantics. Make the public site editorial and tangible; make product workspaces quiet, precise and capable. Express warmth through language, composition and real work, not childish mascots or stock enterprise photography.

Color remains useful: category colors distinguish meaningful things; status colors report observed state; the brand accent identifies primary action. Professional does not mean monochrome. Preserve customer-branding boundaries through supported named themes, not first-party branding pasted over a customer's identity.

Explore three genuinely different compositions using the same content and task: research-studio, technical-systems, and deployment-partner. These are comparison candidates, not three new brands. Change hierarchy, imagery, density and interaction emphasis—not merely hue. Select one direction before migrating the portfolio. Do not combine every attractive detail into an incoherent fourth design.

## Reference journeys, not isolated screens

1. **Company to product:** understand what Tangle does, choose a relevant example, reach the supported product or an honest deployment conversation. A new visitor should not need to decode repo names.
2. **Agent work to accepted artifact:** use GTM as the first consumer because it is already a shared-design reference. Give a brief, inspect the work product and its sources, correct it, approve an authorized action where supported, and return to the retained work. Do not redesign this as another workflow builder.
3. **Technical inspection:** a Sandbox run or Discovery result with a useful chart, record detail and failure/unknown state. Research figures and operational dashboards may use different density while sharing type, controls and semantics. Intelligence is not required to demonstrate this journey.

Later rollouts include professional-document, creative and hospitality surfaces. They keep their domain tasks and approved scope. A legal work product may need a document-first composition rather than the same chat-first page as GTM.

## What the system must resolve

| Area | Required design outcome |
|---|---|
| Type and layout | A clear reading order; readable body and numeric type; consistent header/content edges; breathing room without empty dashboard acres. Dense content remains inspectable. |
| Buttons and controls | One primary action for the current decision; verbs name the effect; consistent size, icon placement, focus, disabled and pending behavior. No fake progress or duplicated action bars. |
| Sidebar and navigation | Workspace/account context and navigation remain predictable; secondary navigation recedes; long names and narrow screens work; returning from an artifact restores context. |
| Work products | The document, comparison, image or result is the focal point. Conversation gives direction; activity detail is available without becoming the product's main visual. |
| Charts | Begin with the reader's question. Show units, period, baseline where relevant and missing-data meaning. Preserve the existing producer/library boundary and honest zero/null/interval behavior. Offer exact values and accessible detail; never decorate a chart with unsupported rankings. |
| Motion | Clarify where an object went, which pane opened or what state changed. Keep controls immediately usable, preserve focus, respect reduced motion and avoid layout shifts during streaming. No animation to imply work that did not happen. |
| States | Design empty, populated, long-content, loading, interrupted, denied, unknown, error and success states together. Essential context cannot depend on hover. |
| Mobile | Recompose the task around reading, deciding and returning; do not shrink a desktop dashboard. Detail panels become an intentional navigation state with a reliable way back. |

Use [Charts](https://github.com/tangle-network/charts), existing controls and surfaces as the implementation basis. Audit the current stories and real consumer versions before creating another primitive.

## Delivery method

**Baseline.** Capture the actual reference journeys, including a phone-width view, a dense record, a failure and an interruption. Record what prevents understanding or completion. Source inspection and mockups are not served-app inspection.

**Explore.** Compare the three compositions side by side with identical representative content. Use real, permissioned artifacts where possible; label illustrative data. Judge recognition, comprehension, visual hierarchy and task flow—not an average model-generated beauty score.

**Choose and build.** Record the selected direction and its trade-offs in the existing PR, following the design bible's existing direction-approval policy. Exploration, critique and implementation use the same shared visual policy. Build the selected direction through one complete journey in a real consumer. Use an existing preview or feature flag when available; do not create a design-review service.

**Encode the starting point.** Put the chosen defaults and complete examples into the existing template, starter or shared composition. For a workflow, preview its purpose, supply safe defaults, ask only for missing information or decisions that cannot safely be inferred, and save a paused draft before activation. For an agent app, make its first useful work product and correction path clear. Optional notifications and advanced controls stay optional; spend and external actions retain their required consent. Instantiate the template or generate the app and exercise that result. A documentation edit alone does not establish that new products start well.

**Extract and adopt.** Move only repeated, demonstrated improvements into their existing owner: Brand tokens, UI primitives, Charts, Sandbox UI widgets, or Agent App compositions. Publish needed package changes, pin the real version in the consumer, verify the rendered flow, then migrate additional products. Package publication is not consumer adoption. Keep domain content and confidential customer material out of shared packages.

**Critique and finish.** Compare old/new while performing the task. Ask what the product is, what happened, what to do next, and what cannot safely be assumed. Collect direct feedback from the founder and relevant users; low traffic is not a reason to invent an A/B-test result. Retain remaining defects by owner. Do not freeze unrelated development or add broad mocked suites to certify visual taste.

## Useful references and limits

- [Katie Dill: How to scale intent, quality, and artistry with AI](https://www.youtube.com/watch?v=GLvFTMtw4Jk): encode a clear point of view in the creation tools, review complete experiences and explore beyond the first plausible output. These are design practices to test, not evidence of a guaranteed numerical improvement or a mandate to replace one tool interface with another.

- [Linear's March 2026 refresh](https://linear.app/now/behind-the-latest-design-refresh): attention hierarchy, consistent chrome, in-product comparison and coding agents used under a coherent direction. Adopt the method, not Linear's palette.
- [Apple chart guidance](https://developer.apple.com/design/human-interface-guidelines/charts): make the key information legible and provide accessible detail. Do not equate polish with glass effects.
- [GitHub Primer navigation](https://primer.style/product/ui-patterns/navigation/) and [AI accessibility principles](https://primer.style/accessibility/foundations/copilot-principles/): preserve context, predictable state and recoverability.
- [Airbnb's 2025 app presentation](https://news.airbnb.com/product-releases/airbnb-2025-summer-release): coherent task journeys across related offerings. Borrow product clarity, not travel imagery or a copied identity.

The initial review read public pages and repository guidance. Live-site browser capture was blocked in the review environment; no authenticated application walkthrough or pixel-level visual audit is claimed. The baseline capture remains actual work to do, not a checked box.
