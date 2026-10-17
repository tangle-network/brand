# Tangle design bible

## Vision

Tangle makes delegated work visible, usable and controllable. A cropped canonical knot, concentrated display typography and restrained indigo atmosphere establish identity. Atmosphere recedes inside work: quiet, aligned planes give artifacts room to read, compare and use. Approval foregrounds consequences; completion foregrounds the artifact. Marketing makes a memorable argument backed by product proof. Editorial pages use paper, ink and sustained reading.

## From intent to a working product

Before composing screens, name the user's job, the first useful artifact and what makes completion trustworthy. Choose a strong default path for that task; reveal advanced choices when they become useful. Ask only for information or decisions the product cannot safely infer. Explain consequential defaults and keep them reversible where possible. Defaults never replace required consent for spending, publishing, permissions or other consequential actions.

Encode this judgment in existing templates, starters and shared compositions with runnable examples. Skills link to this policy and teach its application. Verify that an instantiated template or generated app inherits the intended experience; updated instructions alone do not establish adoption. Label sample data and simulated outcomes.

Use the [reference-journey brief](design-refresh.md) to apply this vision across products. It adds no role, approval service or merge gate; detailed measurement remains in the [evidence contract](design-evidence-contract.md).

## Visual grammar

Keep the canonical knot intact; crop or scale supplied assets. Router’s grid, centered composition, badges and loops are choices for that page. Use supplied smooth waves for launches and light wave/paper assets for editorial work.

Use Brand’s indigo/periwinkle accents, cool surfaces and paper/ink. Named themes own variations. Display type carries short claims; sans carries work and reading; mono carries code and aligned identifiers. Align optical edges, constrain reading measure and remove redundancy before reducing type. Recompose for phones.

Borders explain grouping; elevation explains overlap. Avoid meaningless nested cards. Executable tokens own values; follow the [control](control-scale.md) and [surface](surfaces-and-states.md) contracts.

## Visual restrictions

Avoid green identity, default pure-black canvases, tiny heading eyebrows, taxonomy chips, traffic-light rows, fake status boards, generic agent-step cards and pages made entirely of text/chips/cards. Keep theme experiments in scratch files.

## Theme roles

Dark serves homepages, product sections, screenshots, trace diagrams and launches. Light serves blogs, research, docs and long reading.

## Product hierarchy

Lead with Sandbox, Router and Intelligence. Open-source tools provide supporting proof and adoption paths; specialized agents are examples. Each section makes one decision easier.

## Copy standard

Name the product, value or decision directly. Explain what changes for the buyer or builder. Use evidence to carry detail; earn the CTA. Remove invented labels, internal taxonomy, obvious mechanics and repeated claims.

## Graphic standard

Every major brand page needs a visual idea: a deliberate brand atmosphere, real product composition, routing/trace diagram or research figure. Label concepts. Reject uncontrolled gradients, icon rows and decorative copy cards.

## Component standard

Show components that real products consume, in real states. Keep one canonical run/tool row; retain adapters only for active migration. Stories teach useful work, not process theater.

## Shared review requirements

Tokens need a cross-app reason; reusable components need a consumer or migration target. Regenerate compatibility styles after token changes. Exercise nested and named modes. Fix shared causes in their owner.

## Theory

1. Hierarchy follows the task. Keep one primary action per view; a modal temporarily owns priority.
2. Artifacts carry value. Show useful partial results and controls during execution, exact consequences during approval, and artifact use after completion.
3. Trust requires provenance. Distinguish proposals, attempts, observations and verified results; reasoning summaries cannot establish correctness.
4. Delegation preserves control. Design the complete journey from intent and first useful result through correction, completion and return. Interruption, approval, failure and reconciliation belong in that journey. Preserve work.
5. Density serves comparison. Align comparable rows, expose necessary fields together and give documents a reading measure. Containers and smaller type do not establish density.
6. Motion gives objects coherent behavior. Response, tactility, continuity and recognition justify it; frequency and attention determine its amount.
7. Shared behavior builds recognition. Preserve action names, semantics, keyboard behavior and consequences across products.

## Examples

Replace the five HTML wireframe pairs with shipped surfaces as they land: [Router hero](https://router.tangle.tools/) first, then GTM chat after #10193.

## Motion character

Keep the shell anchored and controls locally responsive. Panels emerge from triggers; artifacts expand from previews. Preserve content identity across containers. Settle without default bounce; keep routine work quiet.

| Sequence | Required behavior |
|---|---|
| Open artifact | Keep title/content together; expand from preview bounds after establishing destination layout. |
| Reverse halfway | Retarget current geometry and velocity; never restart or queue opposite intent. |
| Close or Back | Restore meaningful origin, focus and reading context; skip routine entrance choreography. |
| Phone navigation | Reveal anchored overlay/expansion, preserve page position and keep dismissal available. |
| Stream or complete | Render available output immediately; preserve the reader’s anchor. |

Consume Brand’s `--motion-control`, `--motion-surface`, `--motion-dismiss`, `--motion-stream` and `--motion-arrive` [roles](../packages/brand/src/styles/tokens.css). Prefer transform/opacity; justify layout animation with a trace. Never use `transition: all`, delay input, stagger actions or animate individual output tokens. Reduced motion removes spatial movement, blur, parallax, smooth scrolling and loops. State, focus and cancellation must work without animation-end events. Decorative loops need pause/still alternatives and stop during task work.

## Interaction

Read elapsed-time thresholds from Brand’s `--interaction-*` roles; convert CSS time units explicitly. Reduced motion preserves these budgets.

| Measure | Rule |
|---|---|
| Local feedback | Aim for next frame; p95 must meet `--interaction-feedback-budget`. |
| Pending | Mark immediately; show contextual loading after `--interaction-pending-delay`, without resizing or minimum spinner duration. |
| Long work | At `--interaction-long-work-delay`, show observed phase or honest unknown and elapsed time. Offer available cancellation; otherwise explain that work cannot be cancelled and provide status/reconciliation. |
| Mutation | Target p95 committed acknowledgment within `--interaction-mutation-budget`; otherwise agree a workflow target and retain pending state. |
| Useful output | Freeze usefulness; measure request-to-useful-artifact and completion separately, including failures. |

Define applicable rest, hover, press, focus, unavailable, selected, pending, success, failure and invalid states. Keep labels visible, explain unavailable actions and preserve input on error. Dialogs own initial focus, Escape, containment and return.

Optimism requires reversibility, pending identity and rollback. Acknowledge external effects before success; reconcile ambiguous disconnects before retry. Stop responds immediately and stays pending until confirmed. Follow streams only at bottom; scrolling up suspends following and exposes new-output access. Reopening restores artifact, state, draft and reading context. Announce phases, not tokens; keep reasoning secondary.

## Principles and evidence

| Principle | Evidence |
|---|---|
| Put decisions first | One primary; returning users identify state and next action. |
| Show actual work | Claims trace to events or artifacts. |
| Preserve control | Disconnect/cancel/retry fixtures reconcile persisted state and effect counts. |
| Protect readers | Draft/run identity and reading anchors survive changes and return. |
| Share behavior | Imports, consumer stories and scoped drift findings. |
| Make hierarchy selective | Compare grouping, optical alignment, type, measure and planes with shipped references. |
| Respond to intent | Calibrated traces, consecutive samples and interruption checks. |
| Include every input | Keyboard, physical touch, screen reader, reflow, zoom and contrast checks. |
| Survive real content | Empty, long, large, slow and failed fixtures. |
| Spend motion deliberately | Purposeful continuity, immediate reversal and reduced-motion behavior. |

For major redesigns compare three materially different compositions or interaction models on the same real task, content and constraints. Change hierarchy, density or interaction emphasis, not only decoration. Critique the running product while performing the journey; use matched evidence to identify what to keep, change and verify, and repeat the affected path after revisions. Small fixes can reuse unaffected evidence without a new exploration exercise. Judge craft separately from task success, using [Apple’s fluid interfaces](https://developer.apple.com/videos/play/wwdc2018/803/) and shipped products. Drew approves design direction. The [evidence contract](design-evidence-contract.md) owns measurement and study protocols. Brand owns shared policy, tokens and recipes; product docs own composition/recovery, skills own procedures. The [reconciliation](design-rule-reconciliation.md) records rule ownership.
