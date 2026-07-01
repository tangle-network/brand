# tangle-network/brand

Tangle design-system foundation: brand tokens + generic UI components.

## Packages

| Package | Path | Description |
|---|---|---|
| [`@tangle-network/brand`](packages/brand/README.md) | `packages/brand/` | Tokens, fonts, Tailwind v4 `@theme`, Logo. Published API unchanged from 0.2.x. |
| [`@tangle-network/ui`](packages/ui/README.md) | `packages/ui/` | Generic React components for product surfaces. |

## Guidelines

- [Brand guidelines](docs/brand-guidelines.md)
- [Component audit](docs/component-audit.md)

## Versioning

Each package versions independently via [changesets](https://github.com/changesets/changesets). See the per-package READMEs for install and usage docs.

## Development

```bash
pnpm install
pnpm build        # build all packages
pnpm typecheck    # typecheck all packages
```
