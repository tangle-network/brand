# @tangle-network/ui

Generic React UI components for Tangle products. Imports tokens from `@tangle-network/brand` (peer dep). Tailwind v4-native.

Component visual precedent is governed by the repo-level [brand guidelines](../../docs/brand-guidelines.md) and [component audit](../../docs/component-audit.md). Storybook examples are test surfaces; they are not automatically approved brand patterns.

## Install

```sh
pnpm add @tangle-network/ui @tangle-network/brand react react-dom
```

## Use

```tsx
import { Button } from "@tangle-network/ui/primitives";
import { Logo } from "@tangle-network/brand";

export function App() {
  return (
    <>
      <Logo size="md" />
      <Button>Click</Button>
    </>
  );
}
```

## Subpaths

Sixteen named exports: `primitives`, `chat`, `run`, `openui`, `files`, `editor`, `markdown`, `auth`, `hooks`, `sdk-hooks`, `stores`, `types`, `utils`, `tool-previews`, `nav`, `redaction`.

## Optional peers

`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-caret`, `@hocuspocus/provider` and `yjs` back the `./editor` entry. The entry reaches every one of them through a dynamic `import()`, and gets a loud error that names the missing packages only when it renders an editor. `./editor` splits the cost in two: the local markdown editor needs `@tiptap/react` and `@tiptap/starter-kit`; the collaborative editor adds the rest.

A bundler still reads the literal specifier in a dynamic `import()`, so what a consumer without the peers must do depends on the bundler:

| Bundler | A consumer that installs none of the peers |
| --- | --- |
| Vite, Rollup | Builds. The unresolved peer becomes a chunk that throws when it loads. |
| esbuild | Builds. Each import carries a `.catch()`, which moves the unresolved path from build time to run time. |
| webpack | Needs configuration. Give `resolve.fallback` the value `false` for each peer you do not install, for example `resolve: { fallback: { "@tiptap/react": false } }`. |

`pnpm test:package` builds a packed consumer that installs none of the peers, under both Vite and esbuild. `scripts/validate-dist.mjs` rejects a static import of any of them, and rejects a dynamic import that lost its `.catch()`.

`nanostores` and `@nanostores/react` back `./stores`, and `react-router` backs `./nav`. Those two entries create their values at module scope, so they hold a static import and a consumer that imports them must install the peer. Every other entry stays free of all of these.
