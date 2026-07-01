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

Fourteen named exports: `primitives`, `chat`, `run`, `openui`, `files`, `editor`, `markdown`, `auth`, `hooks`, `sdk-hooks`, `stores`, `types`, `utils`, `tool-previews`.

## Optional peers

`@nanostores/react`, `nanostores`, `@tanstack/react-query`, `@hocuspocus/provider`, `@tiptap/*`, `yjs` — install only the peers you actually use. The package will type-check and tree-shake without them.
