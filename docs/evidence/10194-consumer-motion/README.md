# Shared motion compatible with consumer policy

GTM and Sandbox rejected the published Motion cohort under their existing dependency-age policies. This follow-up pins a maintained exact cohort without exclusions. Popover and bare Button now reuse the shared surface/control owners; two late B3 accessibility findings are corrected before the code-presentation release. Consumer lanes own served adoption.

## Checked source and scope

`f822fb5cfd35dd2851db4ee19853b97abe7c48fe`, gate `beelink1-a715b4ddec44ef73bd47936dbb1eb92b`, exit0. Frozen install, typecheck, Brand/UI builds and72 affected tests across6files pass. The lock changes only18added/18removed lines for the four exact Motion dependencies. The actual packed UI declares the compatible pin; source and dependencies will be checked again against its immutable published artifact.

Six reversal cases passed at2026-10-15T23:59:05Z: Dialog/Sheet/Popover ×390/1440px. The served role drives a16x slowed fixture with120ms temporal resolution; the same unchanged position/opacity boundary checks, carried velocity in both directions, retained node, settle/focus and live reduced-motion dismissal apply. Two normal/reduced cases passed23:58:37Z, including all three surfaces, Tooltip, bare-control timing, live preference change and focus return.

The initial compatible-cohort DOM animation showed an opacity displacement0.098459 against the measured boundary allowance0.012003 on reopen; geometry stayed continuous ([trace](baseline-opacity.json)). Explicit retained Motion values keep every channel on the same frame clock. Radix Popper temporarily suppresses animation during placement; observing that inline override clearing starts the anchored spring. Radix still owns state, refs, ARIA, presence and focus. No timing threshold was widened.

## Accessibility regressions

Five new cases fail against the merged B3 runtime and pass with this source ([red log](accessibility-red.log)): retained copy bindings restore original label/status during pending/success/failure and silence late completion; absent labels stay absent; a single example keeps readable code without an orphaned tab relationship. Current72-test green includes these cases.

## Inspected media

All12 captures and temporal contacts from all8 recordings were inspected. Popover stays anchored with focus inside, dialog/sheet geometry remains contained, and reduced motion settles without stranding dismissal or focus. These are isolated fixtures, not shipped consumer surfaces.

| Case | Recording | Inspected samples |
|---|---|---|
|all surfaces 390 no-preference|[WebM](motion-placed-preference/videos/page@b03ffcbeb55c6843c60cf5711d05cd81.webm)|[samples](inspection/video-00.jpg)|
|all surfaces 390 reduce|[WebM](motion-placed-preference/videos/page@e8563bf19d897d5948bd7d0f9cf5bf5e.webm)|[samples](inspection/video-01.jpg)|
|dialog 390 normal|[WebM](motion-placed-retarget/videos/page@c41d4bd351707a725341166318a6add4.webm)|[samples](inspection/video-02.jpg)|
|sheet 390 normal|[WebM](motion-placed-retarget/videos/page@7da8ab9f58580143d1505186f0e7737a.webm)|[samples](inspection/video-03.jpg)|
|popover 390 normal|[WebM](motion-placed-retarget/videos/page@c94bc67fcec55540a77c9a9644c6ff86.webm)|[samples](inspection/video-04.jpg)|
|dialog 1440 normal|[WebM](motion-placed-retarget/videos/page@a097f6b6a2038d19ebec52009d1a7bcf.webm)|[samples](inspection/video-05.jpg)|
|sheet 1440 normal|[WebM](motion-placed-retarget/videos/page@20ecd708ccf4c39fb5c1e95fecb1e04c.webm)|[samples](inspection/video-06.jpg)|
|popover 1440 normal|[WebM](motion-placed-retarget/videos/page@27e08d9b030137e7af64e0132c2909db.webm)|[samples](inspection/video-07.jpg)|

Capture contacts: [normal/reduced](inspection/captures-0.jpg) · [settled reversals](inspection/captures-1.jpg).

Receipts: [preferences](motion-placed-preference/receipt.json), [trajectories](motion-placed-retarget/receipt.json), [packed exports](motion-placed-package/presentation-package.json).

The actual packed presentation/code-presentation entries import with React unavailable and exclude React/Radix/Motion from their graphs. Presentation:40,833minified/12,520gzip bytes. Selected React surface proof:185,212/63,485bytes;55,726minified bytes attributed to Motion, not a before/after gzip delta. Code all-exports:2,798,554/365,240bytes folds every dynamic grammar into one output, so initial browser load is unmeasured.

Simplify: Popover deletes its parallel fade/zoom/slide recipes and reuses SurfaceMotion; bare Button reuses controlMotion. Public evidence omits duplicate successful partial receipts and case maps; originals remain local.
