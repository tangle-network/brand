# Tangle design bible

Shared design policy, October 15, 2026. Brand owns this document; executable tokens own values.

Tangle has design guidance and shared components. Use this reading order, visual direction and separate craft and behavior acceptance. Adoption, authenticated workflows and improvement remain untested. The supplied inventory dates product-design and its references to September and October 2026; it does not establish years of neglect. Publication consolidates guidance and tokens. It does not establish consumer adoption or approve the concept studies.

## Vision

Tangle makes delegated work visible, usable and controllable. Its identity joins a large, deliberately cropped canonical knot with concentrated display typography and a restrained indigo atmosphere. The atmosphere recedes as the user enters work. Quiet, aligned working areas give artifacts room to read, compare and act on. Approval brings the proposed consequence forward; completion brings the artifact forward. Motion makes these objects feel responsive, anchored and continuously redirectable. Marketing makes a memorable visual argument supported by real product proof. Editorial pages use paper, ink and sustained reading. The family remains recognizable across these different jobs.

## Visual grammar

Preserve the relationship visible in [Router's hero](https://router.tangle.tools/): a concentrated headline, oversized knot crop and subdued background. Its grid, centered composition, badges and ambient loops are Router choices, not universal templates. Keep the canonical knot intact; crop or scale the supplied asset rather than redraw it. Use the supplied smooth wave assets for hero and launch work, and light wave/paper assets for editorial work.

Use Brand's indigo/periwinkle accents, cool surfaces, paper and ink. The canonical product ladder keeps the faint indigo cast established by GTM; named themes own intentional variations.

Use Brand's display role for a short claim, sans roles for work and reading, and mono for code or aligned identifiers. Keep consistent optical edges and readable measures. Remove redundancy before reducing type. Recompose at phone width; never shrink a desktop arrangement to fit.

Working areas use distinct, quiet planes, with indigo reserved for identity and emphasis. Borders explain grouping; elevation explains overlap. Avoid nested cards without a meaningful boundary. Use Brand's [type/control](control-scale.md) and [surface/state](surfaces-and-states.md) contracts. Executable tokens own values; named themes own intentional variations.

Every major marketing or brand page needs a visual idea. Show real artifacts, screenshots or a diagram that explains actual boundaries; label concepts. Write direct claims about the user's decision and support them with evidence. Remove decorative eyebrows, taxonomy chips, invented activity and unsupported claims. The product hierarchy, graphic and copy standards below apply alongside this grammar.

## Visual restrictions

Named product themes may intentionally retint surfaces through their existing owner. Avoid:

- Green as the production identity.
- Pure black as the default canvas.
- Tiny eyebrow labels above headings.
- Taxonomy chips as design.
- Traffic-light rows, fake status boards, and generic agent step cards as marketing graphics.
- Pages that are only text, chips, and cards.
- Labeling every internal repo or product at once.

## Theme roles

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

## Product hierarchy

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

## Copy standard

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

## Graphic standard

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

## Component standard

Only document or showcase components that should influence product design. A component is approved when at least one real app consumes it and the story demonstrates a real state.

For run and tool UI:

- Prefer one canonical row implementation.
- Keep adapter exports only when consumers still need migration time.
- Do not teach uppercase status pills, step labels, or traffic-light rows as a brand pattern.
- Stories should show real transcript states, not fake process theater.

## Shared review requirements

- Component stories do not create new visual precedent for stale UI.
- Any new token has a cross-app reason.
- Any new reusable component has at least one consuming product or a named migration target.
- Token changes regenerate the compatibility stylesheet and pass its generation check; mode changes are exercised in nested and named scopes.

## Theory

1. Hierarchy follows the current task. One primary action per view prevents competing emphasis. A modal temporarily owns that priority; underlying actions become secondary or unavailable.
2. Artifacts carry value. During execution, show useful partial results and available control. During approval, emphasize the exact effect, affected content and consequence. After completion, emphasize using the artifact.
3. Trust requires provenance. Proposals, attempts, observations and verified results have different meanings. Reasoning summaries cannot establish correctness.
4. Delegation preserves control. Interruption, approval, failure, reconciliation and return belong in the main workflow. A faster-looking interface cannot compensate for lost work.
5. Density serves a comparison. Align rows when comparing runs; give documents a reading measure. Expose necessary comparison fields together. Extra containers and smaller text do not establish useful density.
6. Motion gives objects coherent behavior. Response, tactility, continuity and recognition justify motion alongside comprehension. Frequency and reader attention determine how much movement is appropriate.
7. Shared behavior builds recognition. The same action keeps its name, semantics, keyboard behavior and consequences. Fix a shared cause in its existing owner.

## Examples before adoption

The [annotated gallery](design-examples/tangle-design-examples.html) includes five paired studies with identical content. Each recommended concept has a rejected counterpart. They demonstrate this proposal's taste; they await human approval and do not depict shipped functionality.

| Pair | Decisive difference |
|---|---|
| [Marketing](design-examples/design-marketing.png) | Knot and atmosphere frame the claim; a product artifact carries detail. Reject equal emphasis and decorative boxes. |
| [Working interface](design-examples/design-working.png) | Align goal, phase and Stop; give the draft most space. Reject oversized process cards. |
| [Artifact](design-examples/design-artifact.png) | Title, reading measure and nearby sources form one document. Reject fragmented argument cards. |
| [Approval](design-examples/design-approval.png) | Recipient, content and consequence precede explicit approval. Reject detached, tiny warnings. |
| [Phone](design-examples/design-phone.png) | Recompose into one reading column with accessible detail access. Reject miniature desktop columns. |

Approve the complete set together with normal, interrupted and reduced-motion sequences before publishing it as a shared standard. Replace study content with real consumer evidence as implementation lands. Test recognition with names and small logos removed, then with the knot masked; report exact counts and confusions. No recognition result is claimed.

## Motion character

Tangle's shell stays anchored. Controls respond locally. Panels emerge from their trigger; artifacts expand from their preview into a workspace. Content retains identity while its container changes. Settling is controlled, with no default bounce. Routine work stays quiet.

| Sequence | Required behavior |
|---|---|
| Open artifact | Keep title/content together; expand from preview bounds into the destination. Establish destination layout first. |
| Reverse halfway | Retarget from current geometry and velocity where supported. Never restart from the origin or queue the opposite intent. |
| Close or Back | Return to the meaningful origin and restore focus/reading context. Skip routine entrance choreography. |
| Open phone navigation | Reveal an anchored overlay or continuous expansion; preserve the page position and keep dismissal available. |
| Stream or complete | Render available output immediately. Group completed content only when it helps; preserve the reader's anchor. |

The [recorded concept sequence](design-examples/design-motion-study.webm) demonstrates opening, return and halfway reversal; the [interactive study](design-examples/tangle-design-examples.html#motion) permits interruption. It does not prove production focus, persistence or shared-component behavior. [Apple's fluid-interface demonstration](https://developer.apple.com/videos/play/wwdc2018/803/) supplies the reference for immediate redirection and coherent object behavior.

Consume Brand's [motion roles](../packages/brand/src/styles/tokens.css): `--motion-control`, `--motion-surface`, `--motion-dismiss`, `--motion-stream` and `--motion-arrive`. Shared components own recipes. Prefer transform/opacity; justify layout animation with a trace. Never use `transition: all`, delay input, stagger action availability, animate individual output tokens or move the reader without consent.

Reduced motion removes spatial movement, blur, parallax, smooth scrolling and loops while preserving immediate state feedback. Inspect CSS and JavaScript animations. Prove completion, focus and cancellation without animation-end events. Decorative marketing loops need pause and still alternatives; task work stops them. Do not animate unobserved activity.

## Principles and evidence

Use assertions for observable behavior, named human review for craft, and target-user studies for comprehension. Missing evidence is `UNCHECKED`; scoped `NOT APPLICABLE` requires a reason. An agent's answer is never a user-study result. The [evidence contract](design-evidence-contract.md) defines reproducible protocols and fixtures.

| Principle | Evidence and reviewer | Failure condition |
|---|---|---|
| Put the decision first | Designer reviews one primary action per view; study facilitator uses the frozen return-state question and answer key. | Competing primaries; study below its declared target. Routine fixes need no new recruitment. |
| Show actual work | Engineer links displayed claims to sanitized event/artifact IDs; reviewer checks provenance. | A claim lacks a source or presents unknown as success. |
| Preserve control | Engineer runs disposable disconnect/cancellation/retry fixtures; backend owner reconciles operation IDs, persisted state and provider receipts. | Wrong effect count, lost control or unreconciled success. Video alone cannot pass. |
| Protect the reader | Engineer asserts exact draft/run identity and saved content anchor across stream, expansion, Back and reopen. | Lost input or anchor drift beyond one computed line-height without declared navigation. |
| Share behavior | UI maintainer reviews imports, changed-file findings, consumer stories and scoped drift evidence. | An unjustified local equivalent or shared defect fixed only downstream. |
| Make hierarchy selective | Independent designer compares intended grouping, type, alignment, measure and planes with a named example. | Unresolved craft defect; agent self-approval is insufficient. |
| Respond to intent | Engineer supplies calibrated traces, consecutive samples and interruption assertions. | Budget breach, dropped input or queued reversal. |
| Include every input | Accessibility reviewer checks automated results, keyboard, actual touch and manual screen-reader journeys separately. | A supported input cannot reach the outcome or focus/status is wrong. |
| Survive real content | Engineer runs declared empty/long/large/slow/failed fixtures across supported environments and zoom. | Clipped action, lost information or unjustified page overflow. |
| Spend motion deliberately | UI maintainer inspects active animations; designer judges character/continuity; user evidence supports comprehension claims. | Motion lacks a purpose, blocks interruption or survives reduced-motion restrictions. |

Accessibility checks include 320-CSS-pixel reflow, actual 200%/400% browser zoom, contrast in supported and nested themes, and target size/spacing under [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). Isolated two-dimensional code, tables and canvases may scroll with accessible controls. Automated checks do not replace manual assessment, as [Playwright documents](https://playwright.dev/docs/accessibility-testing).

## Interaction

These acceptance budgets have no current-product measurements. Read their values from the `--interaction-*` roles in [tokens.css](../packages/brand/src/styles/tokens.css). They are elapsed-time thresholds, not animation durations; reduced motion does not change them. Existing product instrumentation must consume these roles, converting CSS time units explicitly when using JavaScript.

| Measure | Acceptance |
|---|---|
| Local acknowledgment | Aim for the next frame. Fail a changed interaction when p95 input-to-relevant-visible-feedback exceeds `--interaction-feedback-budget` in a declared batch. |
| Pending feedback | Mark pending immediately; show contextual loading after `--interaction-pending-delay` unresolved, without resizing the control. Never enforce a minimum spinner duration. |
| Long work | At `--interaction-long-work-delay`, show observed phase or honest unknown, elapsed time and available cancellation. |
| Local mutations | Target p95 browser dispatch-to-committed-acknowledgment within `--interaction-mutation-budget`. Otherwise approve a workflow target and retain pending state. |
| Useful output | Freeze what makes an artifact useful; measure request-to-useful-artifact and completion separately, including failures. First token is diagnostic only. |

The protocol uses two predeclared batches of 40 consecutive attempts per condition, cold/warm separation, nearest-rank percentiles and explicit timing uncertainty. Report every attempt and failed task. Instrument these definitions in the existing product owner; do not retain a hand-only benchmark. [Event Timing](https://www.w3.org/TR/event-timing/) supports input measurement but cannot identify useful output.

Controls define applicable rest, hover, press, focus, unavailable, selected, pending, success, failure and invalid states. Keep labels visible, explain unavailable actions and preserve input on error. Hover cannot carry the only explanation. Dialogs own initial focus, Escape, containment and return.

Optimistic changes require reversibility, pending identity and rollback. External effects need acknowledgment before success; ambiguous disconnects need reconciliation before retry. Stop acknowledges immediately and remains cancellation-pending until confirmed. Follow streaming only at the bottom; scrolling up suspends following and reveals a new-output control. Reopening restores artifact, state, draft and reading context. Keep reasoning summaries secondary and announce phases rather than tokens.

## Quality loop and authority

For major redesigns, compare three substantially different compositions or interaction models using the same real task and content before selecting a direction. Small corrections keep the established workflow. This uses existing [variants](https://github.com/drewstone/dotfiles/blob/main/claude/skills/product-design/references/variants.md), consistent with [Linear's exploration process](https://linear.app/method/manage-design-projects).

Judge usability and craft separately. Compare equivalent stills and recordings with a named property in [Geist Select](https://vercel.com/geist/select), Apple's artifact/app continuity, or [Linear's operational hierarchy](https://linear.app/now/how-we-redesigned-the-linear-ui). An independent designer records specific verdicts for hierarchy, optical alignment, typography, contrast, continuity and material consistency. Any unresolved blocking craft finding fails craft acceptance even when tasks pass. Blinded preference supplements judgment.

Use [product-design](https://github.com/drewstone/dotfiles/blob/main/claude/skills/product-design/SKILL.md) for procedures and [UI evidence](https://github.com/drewstone/dotfiles/blob/main/docs/anti-patterns/ui-evidence.md) for capture. Static/copy changes need screenshots; changed interactions need video. Production-flow claims require an uncut production video and served revision, plus effect receipts where applicable. Follow existing fast merge, post-merge and deployment gates. Reuse proof until relevant inputs change.

A green [drift check](../packages/brand/bin/tangle-drift.mjs#L320) proves bounded aggregate source counts. Removals can offset additions; unrecorded metrics do not fail. Record installed revision, registered surface, scanned commit, baseline coverage and changed-file review. Router adoption must add registry/baseline coverage. Browser behavior remains separate.

Before claiming consumer adoption, existing maintainers must name and acknowledge the policy approver, UI maintainer, product designer/engineer and independent reviewer. Names are unverified here; roles alone do not authorize approval. The policy approver owns weekly journey review and fortnightly user observation. Exceptions need rule, scope, evidence, mitigation, independent approver and expiry in the existing PR. Expiry requires renewed review or a fix. Accessibility, truthful state and duplicate-effect protection cannot be waived.

## One authority

Brand owns shared policy, tokens, recipes and approved examples. Product docs retain composition and recovery semantics. Skills retain procedures and link here. The [rule reconciliation](design-rule-reconciliation.md) explicitly resolves eight inventory conflicts, preserves unchanged rules in their owners and governs the 39-file manifest. The reconciliation records moved clauses and retained owners. Additional retirements require rule mapping, reader counts and incoming-link updates.

Reuse selected [Emil motion review](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/SKILL.md), [Impeccable critique](https://github.com/pbakaus/impeccable/blob/8a0e198da34ebc5b936a9d5975fb7a3b1cf353b7/.claude/skills/impeccable/reference/critique.md) and [Vercel behavior checks](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) through product-design. Preserve Tangle's typography, identity and owners. Pin adopted files, record modifications and retain license/NOTICE requirements in adoption records. Apple and commercial essays remain linked references. Resolve `artifact-design` before replacing its reference; an adjacent skill is not a proven alias.

## The 10x and 100x ambition

The hill is exceptional, controllable agent work. The supplied audit sampled six public interactions; authenticated GTM remains unscored. Begin with one complete GTM journey and its approved examples, then consolidate demonstrated lessons and propagate shared fixes.

Freeze equivalent tasks, starting states, correctness/usefulness rubrics and time limits. Counterbalance baseline/candidate order across ten target users. Require nine to identify state and next action within five seconds of returning, and nine to recover unaided without duplicate effects. Target half baseline median active time, with unchanged correctness and no lower completion. Count failures, assign incomplete tasks the frozen timeout in the all-assigned analysis, and report completion and successful-task times separately. Craft and recognition remain separate verdicts. These formative targets cannot establish 10x.

Assign design authority before work starts. Determine staffing from observed ownership and capacity gaps. The 100x ambition tests durable cross-product resume and redirect, with replayable failures and outcome measurement in existing tools. Cost includes deferred feature work. Limit the first implementation to one journey and shared causes; rollback through normal releases.

The failure scenario is broader publication without changed behavior. An unfamiliar designer following the guide, a demanding independent craft review and measured consumer outcomes decide adoption. If users fail despite checklist passes, change the rules. Stop expansion until both task and craft acceptance pass.

## Review dispositions

These statements describe revisions, not critic reapproval. T is taste; E is enforceability. All source critiques remain retained.

| Finding | Disposition |
|---|---|
| T1, must-fix | Added a specific knot/type/atmosphere/workspace grammar and a deidentified recognition test. |
| T2, must-fix | Added five annotated same-content pairs and a motion study; independent human approval and consumer recordings remain pending consumer implementation. |
| T3, must-fix | Added anchored object behavior, preview expansion, return, interruption and halfway reversal with a playable study. |
| T4, must-fix | Resolved approval/execution/completion priorities, comparison-based density and one primary action per view. |
| T5, must-fix | Added bounded exploration of three different models before major redesign selection. |
| T6, must-fix | Added independent craft verdicts, exact comparison properties and separate usability/recognition decisions. |
| T7, should-fix | Restored graphic/copy standards and linked implementation, licensing and migration administration. |
| T8, should-fix | Put a complete journey and approved examples first; staffing follows observed authority/capacity gaps. |
| E1, must-fix | Every principle now has evidence, reviewer and failure conditions; missing proof stays UNCHECKED. |
| E2, must-fix | Bounded drift claims and required revisions, surface/baseline coverage, Router registration and separate runtime checks. |
| E3, must-fix | Added disposable race/disconnect/retry fixtures and correlated operation, persisted-state and provider receipts. |
| E4, must-fix | Defined clocks, sampling, cold/warm conditions, nearest-rank percentiles, uncertainty and breach rules. |
| E5, must-fix | Separated automation, keyboard, physical touch, screen reader, reflow, actual zoom and target-size checks. |
| E6, must-fix | Specified authority and exception lifecycle; actual acknowledged names remain unavailable at publication, so adoption is blocked on their assignment. |
| E7, should-fix | Added clause retention/replacement records, eight explicit conflicts, procedural-owner links, per-view action scope and static/video distinction. |
| E8, should-fix | Froze task/rubric rules, counterbalanced ordering, counted failures and predefined timeout and completion reporting. |
