# OpenUI schema browser proof

Source: Brand PR #147, `OpenUI/ArtifactRenderer` Storybook states.
Target: local Storybook iframe at `127.0.0.1:6009`, Chromium via Playwright on GTR.

The invalid state uses a card with an unsupported nested `section`.
Both dark desktop and light mobile render an explicit `role=alert` with `$.children[0]`.
The valid nested card renders its heading, stat, and text.
All three views returned HTTP 200, had no page or console errors, and had no horizontal overflow.

- [Invalid dark desktop](invalid-dark-desktop.png)
- [Invalid light mobile](invalid-light-mobile.png)
- [Valid dark desktop](valid-dark-desktop.png)

This local Storybook proof does not establish a deployed GTM Vault flow.
