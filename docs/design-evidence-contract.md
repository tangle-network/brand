# Design evidence contract

Companion to the [design bible](design-bible.md). These are acceptance definitions, not measured product results. Adopt them in existing product instrumentation and PR evidence; do not create another scoring service. Budget values belong to the executable interaction roles in [tokens.css](../packages/brand/src/styles/tokens.css); the bible defines their acceptance semantics.

## Evidence record and reviewers

For each changed journey, record URL, served/source commit, installed Brand revision, device, browser, viewport, refresh rate, theme, motion preference, input modality, fixture revision, starting state, steps, expected outcome, actual outcome, failures, evidence links and accountable reviewer names. Sanitize data and identifiers before sharing. An agent may run assertions and summarize evidence; it cannot impersonate a user or sign an independent craft verdict.

Use PASS, FAIL, UNCHECKED and scoped NOT APPLICABLE with a reason. Missing evidence stays UNCHECKED. A skipped input method, unregistered surface or unknown served revision cannot silently inherit another check's result. Product accessibility and security owners remain responsible for their existing standards.

## Latency protocol

The implementing engineer instruments these boundaries in the existing product telemetry:

- Local response starts at the browser input event timestamp. It ends at the first presented frame containing the intended visual state change on the relevant control. Log handler start separately. Event Timing's next-paint duration is supporting evidence and does not identify which feedback appeared.
- Network acknowledgment starts at browser request dispatch and ends when the browser receives the application's committed success or failure acknowledgment. This is browser-observed round-trip time. Retain separate server execution spans. Receipt of an HTTP response alone does not establish persistence or an external effect.
- Useful output starts at the accepted user request, using one declared client clock. It ends when the visible artifact first satisfies the workflow's frozen usefulness rubric. Record backend acceptance delay separately. Completion requires the frozen correctness rubric and persisted result. First token remains a separate diagnostic event.
- Record pending marking, contextual loader onset/removal, observed phase, elapsed display, cancellation request and cancellation confirmation against those clocks. Do not infer network duration from animation completion.

Before each comparison, declare hardware, operating system, browser, refresh rate, network profile, workload/concurrency, fixture, action list and cold/warm definition. Cold means a new context without application cache; warm means the same loaded workflow after initialization. Run each claimed condition separately. Do not pool different devices or network profiles.

For each changed interaction and condition, retain two batches of 40 consecutive scripted attempts selected by input start. Use predetermined resets and spacing. Record every attempted input; a dropped input fails behavior acceptance. Exclude only capture failures identified by a predeclared validity check, retain their count and reason, and replace them. Slow requests and product failures are not capture exclusions. Show cold and warm results separately.

Use the sorted nearest-rank percentile, rank ceil(p × n). Report both batches, p50, p95, maximum, failures and all samples. A batch exceeding the local-response budget fails; do not rerun to erase it. Repetition across batches supports the diagnosis, not permission to disregard the first failure. A breach of the local-mutation target requires a reviewed workflow target and an honest pending state before acceptance. No full-suite benchmark is required for an unchanged interaction.

Use browser traces, marked frame captures and calibrated recording timestamps to identify visible feedback. Record timestamp quantization and capture frame interval. If uncertainty spans a budget boundary, mark the measurement UNCHECKED and improve the instrument. A loaded host's callback gap does not prove a dropped display frame. Validate the instrument against a deliberately delayed fixture before claiming accuracy. Store this measurement in the existing live instrument during implementation; the capture script is only a reference.

References: [Event Timing](https://www.w3.org/TR/event-timing/) and the existing [UI evidence procedure](https://github.com/drewstone/dotfiles/blob/1eefcc1e30bbd91c5a5c29ed57d6e7abc2bf8261/docs/anti-patterns/ui-evidence.md).

## Persistence, effects and cancellation

Use an authorized disposable workspace and provider fixture. Declare the expected external-effect count for each scenario before running it. Do not use real customers or send actual outreach to test retries.

Exercise disconnect after server acceptance, cancellation before acceptance, cancellation racing with provider acceptance, duplicate retry submission and reopening after uncertain outcome. Link a sanitized operation identity to persisted records and provider-side receipts. Reconcile each terminal outcome. A valid cancellation race may finish with one accepted effect rather than zero; the UI must state the reconciled result accurately. Unconfirmed cancellation remains pending. For each case report expected count, actual count, persisted state and visible state beside the consumer video. A video cannot prove effect count. If provider evidence is unavailable, that safety claim stays UNCHECKED.

Optimistic changes require reversibility, pending identity, rollback and preserved input. External effects report success only after the appropriate server/provider acknowledgment. A disconnect must trigger reconciliation before offering a retry that could duplicate work.

## Reading and recovery

Seed a unique draft, run ID, artifact ID and content anchor. Record the anchor's element identity and viewport offset. Test while following at bottom, after scrolling upward, during streaming, expansion/collapse, delayed media loading, history insertion, Back, disconnect and reopening.

The draft must match exactly and the artifact/run identity must persist. While the reader is above the bottom, preserve the anchor within one computed line-height in the same environment. No animation may move the reader to latest without consent. If changed content removes that anchor, restore the nearest surviving predecessor and expose what changed. A deliberate navigation or focus scroll has a declared destination and separate assertion. The product review must justify any stricter or different domain tolerance before testing.

Follow output only while the reader is at bottom. Show a new-output control after they scroll up. Announce meaningful phases politely rather than each token. Render available content without artificial typing, keep input responsive and keep reasoning summaries secondary to artifacts and evidence.

## Accessibility and content coverage

The product reviewer declares its supported browser/device/theme matrix. Missing declarations block conformance claims. For changed controls, record rest, hover where supported, pressed, focus-visible, disabled with explanation, selected/open/checked, pending, success, failure, empty, filled and invalid as applicable.

Run automated accessibility assertions, separate keyboard and touch journeys, and manual screen-reader review with a named person and the actual screen-reader/browser pair. Verify names, roles, values, reading order, announcements, initial focus, Escape, focus containment and return. Test physical touch on a supported device for changed touch behavior; emulation alone cannot establish it. Preserve native semantics and existing component contracts.

Check actual browser zoom at 200% and 400% on desktop, plus a 320-CSS-pixel reflow viewport. Record zoom and resulting CSS viewport rather than relabeling a small screenshot as zoom. Validate target size and permitted spacing exceptions against WCAG 2.2 AA 2.5.8 without replacing Brand's control scale. Check text and non-text contrast in supported themes and nested opposite-mode regions. These requirements do not waive other applicable WCAG criteria.

Fixtures include empty data, one item, a large virtualized collection with declared count, longest supported labels, a 200-character unbreakable value, long localized copy where supported, missing media, delayed media, partial stream, slow response, timeout, provider error and recoverable failure. Declare fixture IDs and deterministic delays. Assert no page-level horizontal overflow and no clipped essential action. Permit isolated horizontal scrolling only for genuinely two-dimensional content such as code, data tables and canvases; label and keyboard-enable the region. It cannot hide surrounding text or controls.

Inspect active CSS transitions, CSS animations and JavaScript animations with reduced motion enabled before load and toggled while running. Remove spatial movement, blur, parallax, smooth scrolling and decorative loops. Prove state, focus, persistence and cancellation without animation-end events. Zero-duration CSS variables alone do not establish this behavior.

References: [WCAG reflow](https://www.w3.org/TR/WCAG22/#reflow), [target size](https://www.w3.org/TR/WCAG22/#target-size-minimum), and [Playwright's limits on automated accessibility testing](https://playwright.dev/docs/accessibility-testing).

## Craft and user-study decisions

For a major redesign, the accountable designer explores three materially different compositions or interaction models, using the same task, content and constraints. Keep the comparison bounded to the journey. Use the existing variants workflow. Choose a direction and record why it wins before extracting shared recipes.

A named design reviewer other than the author reviews equivalent stills and uncut interactions at matched viewport, content density and playback speed. Name the exact reference example and property. Review hierarchy, optical alignment, typography and measure, contrast, continuity including reversal, material consistency and Tangle recognition separately. Record a verdict and specific evidence for each. Any unresolved defect that obscures a decision, loses continuity, violates the chosen grammar or compares poorly on the named property blocks the craft pass. Aesthetic approval is a human judgment, not an automated score or a passing usability result.

For formative testing, freeze equivalent baseline/candidate tasks, starting states, time limit, assistance policy, usefulness rubric and correctness scoring before recruiting ten target users. Counterbalance order equally and use parallel task content to reduce learning. Ask after five seconds on a returning screen, "What is the current state, and what would you do next?" Score both against a prespecified answer key; do not coach. Record recovery assistance and effect counts. Score artifacts with a reviewer blinded to condition using the same correctness rubric.

Report completion and correctness for all assigned tasks. Count incomplete or assisted recovery as failures. Treat incomplete tasks as timeouts at the frozen limit in the all-assigned active-time analysis; also report successful-task times separately. Active time includes reading, corrections and recovery; report waiting and elapsed time separately. Do not delete failures from a favorable median. Apply the bible's candidate targets only with unchanged correctness and no lower completion. Report individual results and uncertainty. Blinded craft preference supplements these results.

For brand recognition, show deidentified candidate and comparable product screens in randomized order, then ask target users to identify the Tangle family and describe the cues. Mask product names and small logos. Repeat with the large knot masked to check typography, composition and material recognition beyond the mark. Freeze the comparator set and scoring before testing; report exact counts and confusions. No recognition result exists yet, so set a numerical improvement target after that baseline.

## Drift, accountability and release

Record installed Brand revision, registered surface, scanned commit, baseline revision, roots, exclusions, gated metrics, unrecorded metrics and per-file findings. Aggregate counts can hide a new violation behind a removed one. Review changed files and imports as well as counts. An absent metric or registry entry is UNCHECKED, not a pass. Router adoption includes its entry and baseline in the existing registry. Runtime behavior remains a separate browser check. See the [registry](https://github.com/tangle-network/brand/blob/c2c6a15a436282b8c3d09af5767594503f2624b1/packages/brand/bin/tangle-drift.mjs#L30) and [comparison](https://github.com/tangle-network/brand/blob/c2c6a15a436282b8c3d09af5767594503f2624b1/packages/brand/bin/tangle-drift.mjs#L320).

Before claiming consumer adoption, existing repository maintainers must acknowledge the named policy approver, shared UI maintainer, product designer, implementing engineer and independent design reviewer. Record them in existing ownership documentation and the adopting PR. Roles in a proposal are not assignments. The policy approver owns weekly journey review and fortnightly user observation, or records a specific accountable delegate and next review.

An exception records rule, affected scope, reason, evidence, risk, mitigation, named policy approver and expiry in the existing PR. The approver must not approve their own exception. Accessibility, truthful state and duplicate-effect protection are nonwaivable. An expired exception blocks acceptance until renewed with evidence or fixed. Do not add hosted gates.

Use existing fast merge checks, full post-merge suites and release checks. [UI evidence](https://github.com/drewstone/dotfiles/blob/1eefcc1e30bbd91c5a5c29ed57d6e7abc2bf8261/docs/anti-patterns/ui-evidence.md) owns the capture procedure. Static or copy-only changes need matched screenshots. Changed interactions need video. A claim that a flow works in production needs an uncut production recording and served revision, with backend/provider receipts for effects. Reuse evidence until its relevant inputs change. A policy publication proves none of these outcomes.
