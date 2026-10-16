# Dismissal without CSS lifecycle events

Runtime candidate `13b84c16b1becf8be3fd4fbb34c08b95fabf8519`; baseline `bc1fa70e1431ea6cfa55c4339b049c14ea390114`. Isolated real Radix/Motion fixtures; consumer owners retain served adoption. No input-to-presented-frame latency or production claim.

GTM's [exact-source fixture diagnostic](https://github.com/tangle-network/gtm-agent/blob/de31531a413a7c3b5ca2328f1207f8a4701a3419/docs/evidence/dedupe-10198/README.md) showed normal focus cleanup following the nonvisual CSS exit marker. The shared probe withholds actual CSS end/cancel delivery while leaving CSS and Motion running. Radix suspended unmount; normal Dialog/Sheet/Popover kept focus in closed content, while Tooltip kept closed DOM connected with focus already on its trigger.

| Check | Baseline | Candidate | Receipt |
|---|---:|---:|---|
| Normal event-loss dismissal, four surfaces ×390/1440 |0/8|8/8|[red](dismiss-red/receipt.json), [green](dismiss-green/receipt.json)|
| Reduced event-loss dismissal, same cohort |8/8|8/8|same receipts|
| Close/reopen continuity, three surfaces ×390/1440 |retained prior evidence|6/6|[trajectory](dismiss-retarget/receipt.json)|
| Normal/reduced/live preference and focus |retained prior evidence|2/2|[preference](dismiss-preference/receipt.json)|

Red at2026-10-16T01:56:07Z, gate `beelink2-1c18ddae83fe4e694115a91168d80541` exit1. Green at01:58:14Z, trajectory01:58:43Z, preferences01:58:51Z; gate `beelink2-08014ef3d28cf51b6356a00dc5164f0c` exit0,122seconds. Frozen install, typecheck, Brand/UI builds and distribution validation also passed. Full postmerge suite and immutable publication remain separate checks.

`SurfaceMotion` retires its DOM at the computed scoped dismissal deadline even if CSS lifecycle events never arrive. Null-ref cleanup lets Radix release presence and focus. Reopening cancels retirement and preserves the same node and retained motion values. No new timing constant, root wrapper or consumer fork. Reduced/missing motion settles synchronously.

The one-second probe ceiling diagnoses a stranded lifecycle; it is not a latency budget. The trajectory probe slows the scoped role16× and samples DOM values at animation-frame callbacks; it establishes continuity, not presented-frame latency. The first red run failed on a probe locator hidden by modal semantics; it is retained in lane logs as an instrument error and excluded from the behavioral comparison. The corrected probe stores the opener before opening. Public numbers are rounded to six decimals; originals remain in the lane archive.

All32red and44candidate stills, plus temporal samples from every16red and24candidate mapped recording, were inspected. The dialog remains within the phone viewport, the sheet keeps its edge, and Popover remains anchored. Closed screenshots look similar before/after because the defect is retained invisible DOM/focus; the receipts establish cleanup. These are fixture conformance checks, not a live craft grade or user study.

## Mapped recordings

### dismiss-red

- [dialog/390/no-preference](dismiss-red/videos/page@2d05930c8dd6dedba8d8e3f75ba873f0.webm)
- [sheet/390/no-preference](dismiss-red/videos/page@7e5ddc0d3473d0f3237ef95d54c13521.webm)
- [popover/390/no-preference](dismiss-red/videos/page@457cbe4e25fa56a9c5de045d0e9be036.webm)
- [tooltip/390/no-preference](dismiss-red/videos/page@12c8696c74dd42bf8b1e4117e006d01b.webm)
- [dialog/390/reduce](dismiss-red/videos/page@5ab7c1dbdea23cd25f9a145e1a13ba65.webm)
- [sheet/390/reduce](dismiss-red/videos/page@f38ce7b2c9f4f39ee38c516a9f9bf1e8.webm)
- [popover/390/reduce](dismiss-red/videos/page@e8f96e1d9883f425d998c6de50bb8f8d.webm)
- [tooltip/390/reduce](dismiss-red/videos/page@12050af1449101b91731f24cab16104f.webm)
- [dialog/1440/no-preference](dismiss-red/videos/page@91ca5cfd69d0aadb8d612d9408ca553c.webm)
- [sheet/1440/no-preference](dismiss-red/videos/page@afaf8ecca2e04e6d820c8683f432f0fc.webm)
- [popover/1440/no-preference](dismiss-red/videos/page@4ecf65f5646db2544dba1a259c3250d8.webm)
- [tooltip/1440/no-preference](dismiss-red/videos/page@16377325470106cf7fe166252378a6b4.webm)
- [dialog/1440/reduce](dismiss-red/videos/page@1ccb4f2f512d582cbb1bce9b07e5e945.webm)
- [sheet/1440/reduce](dismiss-red/videos/page@7c6fb84f1b88cb022a036c86810d4240.webm)
- [popover/1440/reduce](dismiss-red/videos/page@bc074d8cf98b244468e3668a8f770880.webm)
- [tooltip/1440/reduce](dismiss-red/videos/page@c06241a356ff5f9c588a151cf23df4d4.webm)

### dismiss-green

- [dialog/390/no-preference](dismiss-green/videos/page@1ccfa227c1fc645f0d0ba6f3bfc60126.webm)
- [sheet/390/no-preference](dismiss-green/videos/page@cacb346ffcdc32f7f12aae52fcf71a3f.webm)
- [popover/390/no-preference](dismiss-green/videos/page@200f5b1b1955d94e6bd01e59d39dde7a.webm)
- [tooltip/390/no-preference](dismiss-green/videos/page@baf85477e706ff2c2bf7e1bb058abae8.webm)
- [dialog/390/reduce](dismiss-green/videos/page@48b02e08a31b716376a544f4a36c7135.webm)
- [sheet/390/reduce](dismiss-green/videos/page@38c3d1f5a5e85e332998573208724d95.webm)
- [popover/390/reduce](dismiss-green/videos/page@186bf0d4083d7e1dd4996e605b995e4f.webm)
- [tooltip/390/reduce](dismiss-green/videos/page@e9a8b20f3edf5881120194be57fdc137.webm)
- [dialog/1440/no-preference](dismiss-green/videos/page@b5f4240d6771fb73031764173b86ba06.webm)
- [sheet/1440/no-preference](dismiss-green/videos/page@cc5a5d36da5d3c6e43ff130caac09ae1.webm)
- [popover/1440/no-preference](dismiss-green/videos/page@ab2e42a659827771416668b2226cf8b0.webm)
- [tooltip/1440/no-preference](dismiss-green/videos/page@befb4489e371d32d78d345f718c183d9.webm)
- [dialog/1440/reduce](dismiss-green/videos/page@8a5c581c78d9943f88dafd851f56b902.webm)
- [sheet/1440/reduce](dismiss-green/videos/page@d74ea0e274289f0e127a754b8672aacf.webm)
- [popover/1440/reduce](dismiss-green/videos/page@69eed2e27acb0418846a4835573e49d6.webm)
- [tooltip/1440/reduce](dismiss-green/videos/page@2849c63a373d4d3eddeddc621ffddeb1.webm)

### dismiss-retarget

- [dialog/390](dismiss-retarget/videos/page@ae18dca67dcb074114f6b6c1ec6c9f7d.webm)
- [sheet/390](dismiss-retarget/videos/page@3e24ddb9f14b3f6a402055b732cee7b3.webm)
- [popover/390](dismiss-retarget/videos/page@ed39862540299fc5c2365fa7f7b4ccac.webm)
- [dialog/1440](dismiss-retarget/videos/page@2b7f4757677bd078c58470de50881dc0.webm)
- [sheet/1440](dismiss-retarget/videos/page@d8661e9c4ca93e0c4c1acf7f6a387f8a.webm)
- [popover/1440](dismiss-retarget/videos/page@751d016ee2ce3a2f9fbb4e03be347dd8.webm)

### dismiss-preference

- [no-preference](dismiss-preference/videos/page@c585598b46d20cd1017a310c8bfd0c01.webm)
- [reduce](dismiss-preference/videos/page@0afa1345757b630aff219494ab6b8184.webm)
