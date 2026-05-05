# @tangle-network/ui

Generic React UI components for Tangle products. Imports tokens from `@tangle-network/brand` (peer dep). Tailwind v4-native.

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
