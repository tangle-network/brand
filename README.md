# Tangle design system

Use Tangle's colors, typography and knot in a website, or build a React interface with its buttons, dialogs, Markdown renderer and recorded examples.

| Package | Start here |
| --- | --- |
| [@tangle-network/brand](packages/brand/README.md) | CSS tokens and themes, React logos, a framework-independent SVG knot, and social metadata |
| [@tangle-network/ui](packages/ui/README.md) | React components with focused imports for controls, forms, Markdown, and application layouts |

## Use the design system

For a React app that already builds Tailwind CSS v4, install the two packages alongside React and React DOM.

```sh
npm install @tangle-network/brand @tangle-network/ui react react-dom
```

In `src/styles.css`, load the theme and let Tailwind discover the component classes. Adjust the relative source path if your stylesheet lives elsewhere.

```css
@import "tailwindcss";
@import "@tangle-network/brand/styles";
@source "../node_modules/@tangle-network/ui/src";
```

```tsx
import { Logo } from "@tangle-network/brand";
import { Button } from "@tangle-network/ui/primitives";

export function Example() {
  return <div><Logo size="md" /><Button onClick={() => window.print()}>Print page</Button></div>;
}
```

For a static page, import `knotSvg` from `@tangle-network/brand/knot`. It produces SVG without React or a browser. The [brand guide](packages/brand/README.md) covers named themes, font loading and metadata.

## Develop locally

Use the Node and pnpm versions listed in [package.json](package.json). From a clone of this repository, run the following commands.

```sh
pnpm install --frozen-lockfile
pnpm --filter @tangle-network/brand build
pnpm storybook
```

Open [Storybook on localhost](http://localhost:6006) to try a component in light and dark themes. Run `pnpm typecheck` and `pnpm test` to check changes. To exercise the browser suite, install Chromium with `pnpm exec playwright install --with-deps chromium`, then run `pnpm test:visual`.

## Design and licensing

- [Brand guidelines](docs/brand-guidelines.md) cover product language, visual hierarchy and component ownership.
- [Control sizes and typography](docs/control-scale.md) and [interaction states](docs/surfaces-and-states.md) explain how the controls behave.
- [Design principles](docs/design-bible.md) and the [component audit](docs/component-audit.md) give examples of how the system is used.
- Both packages use the [MIT license](LICENSE).
