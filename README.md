# tangle-network/brand

Tangle design-system foundation: brand tokens + generic UI components.

## Packages

| Package | Path | Description |
|---|---|---|
| [`@tangle-network/brand`](packages/brand/README.md) | `packages/brand/` | Tokens, fonts, Tailwind v4 `@theme`, Logo. Published API unchanged from 0.2.x. |
| [`@tangle-network/ui`](packages/ui/README.md) | `packages/ui/` | Generic React components for product surfaces. |

## Guidelines

- [Tangle design bible](docs/design-bible.md), shared identity, motion, interaction and evidence principles
- [Brand implementation contracts](docs/brand-guidelines.md)
- [Component audit](docs/component-audit.md)
- [Control and type scale](docs/control-scale.md)
- [Surfaces and interaction states](docs/surfaces-and-states.md)
- [Drift ratchet](docs/drift-ratchet.md)

## Versioning

Each package versions independently via [changesets](https://github.com/changesets/changesets). See the per-package READMEs for install and usage docs.

## Development

Merge `origin/main` before code qualification. Choose the changed package's checks from `package.json` and run them through `beelink-gate auto https://github.com/tangle-network/brand.git <full-sha> -- bash -lc '<commands>'`; the launcher performs the frozen install. Build before the affected integration checks. Workflow and documentation changes use YAML and content checks.

For shared control geometry, accessibility, or upload recovery changes, retain the Chromium check against this exact tree's Storybook:

```bash
beelink-gate auto https://github.com/tangle-network/brand.git <full-sha> -- bash -lc 'pnpm exec playwright install chromium && pnpm --filter @tangle-network/brand build && pnpm build-storybook --quiet && CI=true PLAYWRIGHT_HTML_OPEN=never pnpm exec playwright test tests/visual/control-accessibility.spec.mjs --workers=2 --reporter=html'
```

The Beelink needs Chromium's system dependencies and Python for the existing static server. Keep `playwright-report/` and `test-results/` for review, including screenshots and failure traces. The automatic accessibility workflow is retired; package publication and its artifact verification remain in the release workflow. A Storybook fixture pass does not establish a served application's accessibility or product-flow success.
