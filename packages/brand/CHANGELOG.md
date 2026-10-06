# Changelog

## 1.17.0

### Minor Changes

- ffd18ec: `palettes` exports Brand's resolved colors (light, dark, websiteLight, websiteDark) for renderers that cannot read CSS variables, such as PDF, canvas, WebGL, email and the theme-color meta. `scripts/gen-palette.mjs` generates them from tokens.css and named-themes.css, and the build fails when they are stale.

## 1.16.0

### Minor Changes

- e012234: The canonical surface ladder is GTM's. Dark is indigo-lifted (`#0a0a14` canvas, `#191826` card, `#221f33` nested, `#2c2942` overlay, `#2a293d` hairline); light is a cool `#eceef3` canvas with white paper, `#f1f2f7` wells and a `#c7c6d6` hairline; light syntax uses GTM's palette. Every product on the default theme now renders GTM's surfaces without restating them, and `tangle-dark` repeats the new spine. Ink stays achromatic and surfaces stay below 0.1 chroma, so the accent still signals interaction. Charts regenerates its CSS from the new tokens.

## 1.15.7

### Patch Changes

- cfc08fb: Accent text now reads at 4.5:1 on a selected item's primary tint (10–20%) over the canvas, card and muted surfaces in every theme scope. Darkened light `--accent-text`: canonical, legacy-light, agents-light and website light #5047eb → #3c32e9; aubergine-light #6d28d9 → #6423c8; arena-light #047857 → #03674b; tangle-light #4f46e5 → #453be3; system light iris-11 (#5753c6) → #4e4ac3. Lightened hospitality dark #76b791 → #99caad, with its `--md3-primary` kept equal to the accent text. A new `accent-on-tint.test.ts` asserts the pair for every scope, sharing the scope list with the Switch contrast suite through `theme-scopes.ts`. Agent App projects these values from Brand, so apps pick them up with the next Agent App release built on this version.

## 1.15.6

### Patch Changes

- fc13212: Lower the Blueprint drift baseline to its develop head 92ab705d1: raw palette 204 -> 0, hex 118 -> 0, arbitrary color 49 -> 45, local primitives 2 -> 0.

## 1.15.5

### Patch Changes

- 8c1dbf1: `.tangle-prose` lists show their markers again (Tailwind's preflight removed them), in the muted text colour, and long URLs, emails and identifiers wrap inside the column instead of running past its edge. Matches the same fix in sandbox-ui's prose rules.

## 1.15.4

### Patch Changes

- dbc7691: Lower Legal's drift baseline to legal-agent main b0a7c49: hex 1 -> 0, every count 0.

## 1.15.3

### Patch Changes

- 2dafcac: Lower Physim's drift baseline to physim main 84ad0ac: redeclared tokens 2 -> 1, every other count 0.

## 1.15.2

### Patch Changes

- d787eb7: Lower the Blueprint drift baseline to its develop head 517650bca: raw palette 2585 -> 204 and hex 129 -> 118.

## 1.15.1

### Patch Changes

- 61331a4: Lower the SUPER drift baseline to CSS variable definitions 9 (super-agent main 315daed); hex, palette, arbitrary colors and local primitives stay 0.

## 1.15.0

### Minor Changes

- bb8e620: `tokens.css` now defines the role radii (`--radius-tag`, `--radius-chip`, `--radius-field`, `--radius-panel`, `--radius-cover`, `--radius-sheet`), so apps that load tokens.css without system.css can use them instead of declaring their own. Values match system.css.

### Patch Changes

- 8feb230: Lower the Physim row in the drift baseline to physim main 663cfed: hex 328 -> 0, redeclared tokens 108 -> 2.
- 922bf6f: Lower the GTM and Creative rows in the shipped drift baseline to their default branches after design-system slice 1: GTM gtm-agent 905258f, raw palette 67 → 0; Creative creative-agent 4e1768d, raw palette 223 → 0, hex 307 → 272, arbitrary colours 35 → 0. Their local gates now fail on any new raw palette class.

## 1.14.3

### Patch Changes

- 6b96ac4: Lower the Agent Builder row in the tangle-drift baseline to agent-builder main 305f99a: raw palette 99 -> 0, hex 46 -> 2, arbitrary colors 1 -> 0, redeclared tokens 71 -> 0.
- 4e62c6b: Lower the Hospitality drift baseline to hex 0 (hospitality-agent 1626db3): the guest preview's last raw colors now read the business preset and Brand's danger token.

## 1.14.2

### Patch Changes

- 475ea41: Lower the Hospitality drift baseline to the merged migration (hospitality-agent b297d94): hex 168 to 8, css_var_defs 205 to 0.

## 1.14.1

### Patch Changes

- 6cddfa1: Lower the Legal drift baseline to legal-agent main f0b961c: raw palette 1 -> 0, hex 136 -> 1, arbitrary colors 2 -> 0, CSS variable definitions 267 -> 0.

## 1.14.0

### Minor Changes

- 085e657: Add `--scrim`, `--scrim-strong` and `--on-media` tokens, with `bg-scrim`, `bg-scrim-strong` and `text-on-media` Tailwind colors, for modal backdrops and text on photos.

## 1.13.1

### Patch Changes

- 1170561: Lower the SUPER drift baseline to super-agent main 1a055e7: hex 501 -> 0, CSS variable definitions 104 -> 14.

## 1.13.0

### Minor Changes

- f13e197: Add the Website named theme. `class="dark" data-theme="website"` gives the public site's indigo-night surface ladder; `data-theme="website"` without `.dark` is its indigo-paper light scope, usable as a nested light island. Both modes are seeded from the canonical baselines in `tokens.css` and declare the same properties. Only planes and ink change: accent, status, category and syntax tones stay canonical. The website uses it in place of its local navy and paper token copies.

### Patch Changes

- e7525d0: Lower the Tax drift baseline to its measured main (tangle-network/tax-agent ff4b703): raw palette 133 to 0, hex 8 to 0, arbitrary colors 7 to 0, redeclared tokens 8 to 0. Tax runs `tangle-drift check --surface tax` in its sign-off, so any new palette class, hex value or token copy now fails its gate.

## 1.12.0

### Minor Changes

- e05254d: Add the `agents` / `agents-light` named theme for Agent Builder: white light pages whose cards separate by shadow, and a mauve neutral ladder in both modes. `scripts/gen-ladders.mjs` generates it from the same map as `system.css`, restricted to canonical spine tokens and with literal values, so it needs no `ladders.css`. It retints surfaces, text, borders and the three shadow roles only; accent, status and category tokens stay canonical. Both names join the canonical baseline selector lists, so nested scopes re-resolve their aliases.
  
  Add `data-tone="<category>"` scopes for the eight categorical tones: an element with `data-tone="orange"` reads that family as `--tone-bg`, `--tone-bg-hover`, `--tone-bg-selected`, `--tone-border`, `--tone-border-selected`, `--tone-text` and `--tone-icon`, in both modes.
- a2e24c7: Add the Hospitality named theme: `data-theme="hospitality"` is a complete light scope, and with `.dark` on the same element it is a complete dark scope. Both are seeded from the canonical baselines in `tokens.css`, as `vault` is. It retints the surface ladder to sage, moves the accent family (primary, ring, accent text and wells, buttons, sidebar, brand accents) to forest green, and keeps every status and category tone canonical. The Hospitality app uses it in place of its local 166-property theme file.
- a53b246: Add the `super` and `super-light` named themes for SUPER: warm green-grey surfaces with a forest action colour. Button, selection and accent-surface tokens follow the forest fill. Status and category tones are inherited. `ThemeToggle` keeps the pair when it switches modes.

### Patch Changes

- 6558f63: The `aubergine`, `aubergine-light`, `arena` and `arena-light` named themes retint the base surface: `--md3-surface`, `--md3-surface-dim`, `--md3-surface-bright`, `--md3-surface-variant`, `--md3-on-surface` and `--md3-on-surface-variant` follow each theme's own ladder and text, as they do in the canonical spine. Before, a `bg-surface` element such as a mobile top bar kept the neutral grey surface on a purple or green page.
- daf8f07: The named themes' secondary text tiers clear WCAG AA on every surface they sit on. `--text-dim` in `aubergine`, `aubergine-light`, `arena`, `arena-light` and `tangle-light`, and `--text-muted` in `aubergine` and the light named themes, measured as low as 2.3:1 on their own canvas, card, panel, elevated or highest container. Each now clears 4.5:1 on all five at the same hue and saturation, with muted still stronger than dim. `tangle-dark` mirrors the canonical dark spine, already passes, and is unchanged.

## 1.11.0

### Minor Changes

- ff1cb8b: Add eight categorical tones as `--tone-{violet,orange,teal,blue,pink,brown,cyan,lime}-{bg,bg-hover,bg-selected,border,border-selected,text,icon}` in tokens.css, both themes, generated by `scripts/gen-ladders.mjs` from the Radix ramps and solved against the canonical card: text clears 4.5:1 and icon 3:1 on every fill, dark fills lift 1.3:1 off the card, and icons stay at least 5.5 apart in OKLab. Status tones are unchanged.
  
  `--surface-violet-*`, `--surface-orange-*` and `--surface-teal-*` keep their names; their fill and border are now the family's, a visible change on those chips: violet reads from the purple ramp (Radix violet is 3.1 from the iris brand accent), teal from the teal ramp, and dark fills are raised tints instead of near-black. Their `-text` stays a saturated hue (step 11, darkened only as far as 4.5:1 on the fill needs), because sandbox-ui colours glyphs with it on the card: dark orange `#fb923c` → `#ffa057`, teal `#2dd4bf` → `#0bd8b6`, violet `#c9c4ff` → `#d19dff`; light orange `#c2410c` → `#bc4904`, teal `#0f766e` → `#017d6d`, violet `#3E349E` → `#8145b5`. `system.css` no longer redefines them. `gen-ladders --check` now runs in `build` and `check:compat`.
- de70237: Add the `tangle-drift` bin: a ratchet on design-system drift (raw Tailwind palette classes, hex literals, arbitrary color values, CSS custom-property definitions, local primitive definitions) for the fifteen product surfaces. A consumer runs `tangle-drift check --surface <name> --repo-dir .` in its local gate; it exits 1 when any count rises above the baseline shipped in this package. See `docs/drift-ratchet.md`.

## 1.10.3

### Patch Changes

- 4f70eb8: The dark danger fill is a rose-red tint (`#5a3b40`, was `#533f3e`) at the warning fill's weight, with a quieter border (`#7d4d53`): the brown fill read as muddy beside the amber one. It lifts 1.34:1 off the card, and its text measures 5.53:1 on it.

## 1.10.2

### Patch Changes

- 74fbea5: The dark warning and danger fills are low-chroma raised tints (`#4b4232`, `#533f3e`, was `#6a402c` and `#733b36`) that still lift 1.3:1 off the card, so a callout no longer outweighs the content beside it. Their text measures 5.92:1 and 5.49:1 on the fill. The dark violet fill is `#403d66` with `#c9c4ff` text (6.17:1), so a "Merged" pill reads as a raised chip rather than a dark hole on the card. The teal and orange fills are unchanged.

## 1.10.1

### Patch Changes

- 0132f5c: The dark syntax theme's comment colour is `#9ea2cc` (was `#8b8fbc`). On the card surface (`#303030`) the old colour measured 4.24:1, under WCAG AA for 13px code; the new one measures 5.34:1 on the card and 4.53:1 on the highest container.

## 1.10.0

### Minor Changes

- 48b9dcf: Keep Brand dark-default while exporting a checked, generated light-default compatibility stylesheet. Re-resolve shared aliases and syntax colors at nested mode boundaries, retain named identities, and make ThemeToggle SSR-, storage- and system-change-safe. CodeBlock now uses scoped semantic CSS variables with immediate browser recoloring.

## 1.9.1

### Patch Changes

- 0687011: Make prose inline code use the consumer semantic muted surface in light and dark themes.

## 1.9.0

### Minor Changes

- 720de9a: Normalize the shared neutral palette and regenerate standalone chart tokens so charts follow the palette. Make user message cards wrap in narrow layouts.

### Patch Changes

- d163fb8: Align the named tangle-dark island with the neutral canonical dark spine while keeping Tangle accents and dark status colors intact.

## 1.8.2

### Patch Changes

- 1f0b651: Keep the native field fallback outline off borderless editors inside composite fields. The shared focusFieldWithin helper retains the rounded outer border and halo; standalone fields keep their own focus treatment.

## 1.8.1

### Patch Changes

- dc84d1c: Update every dependency to its latest release and build with tsdown on TypeScript 7.
  `@tangle-network/ui` now accepts `@nanostores/react` 2 as a peer, moves to lucide-react 1 and marked 18, and drops the unused `react-pdf` and `@radix-ui/react-toast` dependencies.
  Export paths are unchanged; internal chunk file names differ.

## 1.8.0

### Minor Changes

- bddb32c: Add `--chart-*` tokens for benchmark charts, dark and light: ink, muted ink, one accent, one muted mark, grid, table rule, row shade and an ordinal App Grade tier ramp (C, B, A, S). Aliases re-resolve on every theme scope; named light themes get the light accent and ramp.

## 1.7.0

### Minor Changes

- 1eff8ab: Add opt-in colour ladders and a semantic token layer.
  
  `@tangle-network/brand/styles/ladders.css` defines 12 ramps of 12 steps, light and dark, from Radix Colors 3.0.0, with role aliases (`--gray-*`, `--accent-*`, `--success-*`, `--warning-*`, `--danger-*`, `--info-*`) and a per-domain ramp under `[data-domain]`.
  
  `@tangle-network/brand/styles/system.css` maps every `tokens.css` family onto a ladder step and adds semantic tokens, role radii, type roles, motion and three shadow levels. Light pages become white and dark becomes a neutral mauve ladder. It is opt in: nothing changes for an app that does not import it.
  
  `scripts/gen-ladders.mjs` generates both files; `pnpm --filter @tangle-network/brand gen:ladders` rewrites them.

## 1.6.0

### Minor Changes

- 4649d22: Replace the hard 2px indigo focus ring with one soft focus treatment for every control.
  
  brand adds `--focus-border`, `--focus-halo`, `--focus-border-danger`, `--focus-halo-danger` and `--border-strong`. Each derives from the ring, danger-ink, border and foreground tokens, so every theme, named theme and light island resolves its own values. The focus border clears 3:1 against the field in every theme, which `focus.test.ts` enforces.
  
  brand's `globals.css` also gives any control that styles no focus of its own (a hand-rolled button, link, radio card or tab) the same keyboard focus line and halo in the base layer, in place of the browser's blue outline. Component utilities still override it.
  
  ui exports `focusField`, `focusFieldWithin`, `focusFieldInvalid`, `focusRing` and `focusRingInset` from `utils`, and the primitives use them:
  
  - `Input`, `Textarea`, `SelectTrigger` and `TerminalInput` rest on the neutral `border-border` hairline instead of the muted-text `border-input`, darken slightly on hover, and on focus shift the border to `--focus-border` with a 3px `--focus-halo` ring. The `default` and `sandbox` variants now render the same field.
  - `Button`, `Tabs`, `Switch`, `Badge`, `SegmentedControl`, the dialog and toast close buttons, the auth menu trigger, and the chat and file controls show a 1px focus line with the same halo on `:focus-visible` only. A mouse click no longer draws a ring.
  - Interactive `Card`, tool-preview and code-block hovers darken the border instead of tinting it indigo.
  
  A consumer that removed the old ring with `focus-visible:ring-0` on a field should pass `focus:ring-0` instead, because the field ring now keys off `:focus`.

### Patch Changes

- 2909c24: `globals.css` gives a native text field that styles no focus of its own a fallback: a 1px `--focus-border` line over its border, in place of the browser's blue outline. It covers `input` (except button-like, checkbox, radio, range, colour, file and hidden types), `select` and `textarea`, on `:focus-visible`, in the base layer. Any outline utility on the field, such as `outline-none` or ui's `focusField`, still wins. The fallback has no halo, so a field that hands its focus to a container and clears its outline shows nothing extra.

## 1.5.0

### Minor Changes

- 532a6d8: Add `--shadow-overlay`, the elevation step above `--shadow-dropdown` for a surface that covers the page rather than sitting beside it — a drawer, a modal, a floating dock.

  It is derived from `--hsl-foreground` rather than a fixed `rgba`, so it inverts with the theme: dark ink in light, a soft halo in dark. That is what makes it work on a dark canvas, where a black shadow renders as nothing. One declaration serves both themes, and the token is declared in the `@theme` block as well so Tailwind emits a `shadow-overlay` utility.

## 1.4.0

### Minor Changes

- e67a809: Raise the dark surface ladder to AA and add the page-level primitives.

  In the dark spine, `--md3-surface-container-high` and `--md3-surface-container-highest` sat close enough to the ink ramp that `--text-dim` fell under 4.5:1 on them. The ladder is re-spaced and the ink ramp moves with it, so every ink tier clears AA on all five planes.

  Dark status chips keep their hue, drop 14% chroma, and lift the fill to 1.50:1 from the card. A new `--run-mix-*` ramp carries proportional bars, spaced in relative luminance so adjacent segments clear the 3:1 floor for non-text contrast.

  One light token moves: `--surface-warning-text` goes `#b45309` to `#ab4f09`. It is a contrast fix, not a hue change. The old value measured 4.16:1 on the light page canvas, under the 4.5:1 body floor, whenever the colour was used as text away from its own pill background; the new value measures 4.51:1 there and 5.25:1 on the pill. Every other light value is unchanged.

  `@tangle-network/ui` gains four primitives: `PageHeader`, `StatusPill`, `MetricStrip`, and `Toolbar`/`FilterField`. All additive; no existing export changes.

## 1.3.0

### Minor Changes

- f3c5262: Add the missing `tangle-dark` named theme. The named set shipped `tangle-light` with no dark sibling, so `data-theme="tangle-dark"` matched no rule and silently fell through to whatever the element inherited — the light spine's values, inside a light-named wrapper. `tangle-dark` now selects the canonical dark spine by name: same indigo family as `tangle-light`, held to the dark contrast discipline, and self-sufficient inside a light-named wrapper (foregrounds and destructive included, so nothing leaks the light values).

## 1.2.0

### Minor Changes

- 2088fb9: Retune the token spine to a neutral-grey surface ladder with indigo as trim rather than as field, in both themes. Surfaces separate by their own fill so a card, a nested panel and an overlay each read as a distinct plane, and the canvas sits off pure black so long reading sessions land away from the glare end of the range.

  Faint text in `Input`, `Textarea`, `StatCard` and `TerminalLine` now takes a dedicated `--text-dim` token instead of a faded stronger one. A translucent foreground renders as its colour composited over the plane behind it, so those hints, subtitles and timestamps measured differently on a card than on the canvas and fell under the 4.5:1 floor on both.

  **Worth a look after upgrading:** in dark mode `--sidebar-background` is now one step BELOW the canvas rather than above it, so the nav reads as chrome the content sits in front of instead of as another raised card. Apps that composited their own surfaces on top of the sidebar assuming it was the lighter plane should give that area a visual pass. Light mode is unchanged — the sidebar is still paper on a grey canvas.

## 1.1.0

### Minor Changes

- 15402db: Ship the indigo surface ladder as the canonical Tangle palette.

  The `:root` spine was a flat, desaturated neutral. Every product app overrode it with its own hand-written palette, so brand's own colors were rendered almost nowhere — and the apps that did inherit them read as grey and washed out, because a flat ladder forces surface separation onto borders instead of fills.

  Both themes now ship the ladder the products actually converged on: an indigo-cast dark scale stepped in even ~4-5% lightness increments, and a light scale of white paper on a tinted canvas rather than white-on-white. Surfaces, depth scale, sidebar and `--bg-root` all move together so the ladder stays coherent.

  Visual change for every consumer. Apps that were overriding the spine should delete those overrides; apps that were inheriting it get the branded look with no code change.

  Also adds a dark-only `intelligence` named theme — a violet surface ramp — and exports the named-theme stylesheet as `./styles/named-themes.css`, so named themes can be imported at all (they shipped, but no export reached them). The name is deliberately not `themes.css`: one letter from the existing `./styles/theme.css` (the Tailwind `@theme` map) is a typo that resolves successfully to the wrong stylesheet. No published version ever exported `./styles/themes.css` — 1.0.0's export map is `./styles/{index,tokens,globals,theme}.css` — so this adds an export rather than renaming a public one, and nothing downstream can break. A named theme re-skins surfaces only; the Tangle accent stays put.

## 1.0.0

### Major Changes

- 0ef3a1a: Graduate `@tangle-network/brand` to stable 1.0.0. The design-token + prose layer is mature and consumed across every app; declaring 1.0 lets its future minors stay within `@tangle-network/ui`'s `^1.x` peer range. Combined with the new `onlyUpdatePeerDependentsWhenOutOfRange` changeset option, this ends the churn where every brand minor force-majored `ui` (5→6→7… all the way to 10). After this one-time coordinated bump, brand token/prose changes no longer re-version `ui` at all — `ui` versions only when its own component code changes.

## 0.9.0

### Minor Changes

- 68e5053: Transcript spacing, markdown styling, and the remaining WCAG AA fixes.

  - **Markdown was unstyled**: `@tailwindcss/typography` isn't loaded and `tangle-prose` was undefined, so structured markdown had no styling — table cells collided (no dividers/padding) and text ran flush into code blocks. Defined `tangle-prose` (self-contained, theme-tokened): tables get border-collapse hairline dividers + cell padding, and blocks (headings, paragraphs, lists, `pre`, code) get proper vertical rhythm. Links use `--accent-text` (readable in every theme).
  - **Timeline spacing**: user messages sat flush against the status/tool/agent row below them. They're off-spine, so they now carry their own vertical rhythm (`mt-6 mb-4`).
  - **WCAG AA (measured live across 7 themes)**: `--btn-primary-*` (dark + all named themes were 4.47/2.98 → now ≥5.9 via `#5B4ED4`/`#4F46E5`); `--hsl-destructive` button/badge (3.67 → ≥4.5); named light themes now carry light-tuned `--hsl-destructive`/`--hsl-secondary-foreground`/`--surface-neutral-text` (were inheriting dark values, secondary badge ~1.05); input borders (`--input` → `--hsl-muted-foreground`) now clear 1.4.11 3:1 as visible field boundaries.

## 0.8.3

### Patch Changes

- 9b91ac6: Fix code syntax highlighting contrast (WCAG AA). `--syntax-*` was defined only in the dark `:root`, so in all four light themes (light, aubergine-light, arena-light, tangle-light) code rendered near-white on the light `bg-card` — foreground ~1.2:1, effectively invisible. Added a light-tuned `--syntax-*` palette (dark-on-light, all ≥4.5:1 on white) for every light scope. Also bumped the dark `--syntax-comment` (`#6B7094`→`#8b8fbc`) which failed AA (~3.4:1) across the dark-family themes. All syntax colors now pass AA on their code surface in every theme.

## 0.8.2

### Patch Changes

- 26cc012: WCAG 1.4.3 AA contrast fixes across all 7 themes (measured with a cascade-resolved contrast audit).

  - **Primary buttons**: `text-primary-foreground` on `bg-primary` was below 4.5:1 in `dark` (4.41) and `arena-light` (4.20). Darkened those two primaries (dark L 67%→62%, arena-light L 30%→27%) — all 7 themes now ≥5.0:1, hue unchanged.
  - **Status colors in the named light themes**: `aubergine-light` / `arena-light` / `tangle-light` inherited the dark `:root` bright status palette (`#f87171`/`#34D399`/…), so danger/success text + glyphs dropped to ~2.5:1 on their light surfaces. Added a shared light-tuned status palette (dark-on-light text, mirroring the base light theme) — status text now passes AA and glyphs pass 1.4.11.
  - **Running tool state**: the "running" label + spinner used `text-primary`, which fell to 2.98:1 on the dark row surface. Switched to `--accent-text` (the readable accent tier) — passes in every theme.
  - **Thinking timer**: the elapsed-seconds counter used the faint `--text-dim` tier (~3:1). Moved it to `--text-muted` (passes AA everywhere).

  Text now meets AA in all 7 themes; most pairs are AAA.

## 0.8.1

### Patch Changes

- d18fce7: Fix `[data-theme]` scopes not re-skinning components, and lift the aubergine palette off near-black so it reads as purple.

  The named themes changed `--hsl-*` spine vars, but Tailwind utilities (`bg-card`, `bg-primary`, `border-border`, `bg-surface-container*`) read the `--color-*` layer, which is declared only at `:root` — so its computed neutral value was inherited by themed subtrees regardless of the spine override (a double-indirection custom-property inheritance trap). Each `[data-theme]` scope now redeclares the `--color-*` layer directly, forcing it to recompute from that element's own `--hsl-*`. Aubergine's base lightness is raised (~7%→12–20% L, higher saturation) so surfaces read aubergine-purple instead of black.

## 0.8.0

### Minor Changes

- 46592b3: Calmer chat/run design + named multi-theme system.

  - `ChatMessage`/`RunGroup`: role labels move above the bubble (plain text-xs), avatar circles removed (`avatar`/`hideAvatar` are deprecated no-ops), `InlineToolItem` rows are taller with quiet inline failed/running text instead of uppercase pills. `ToolCallStep`/`ToolCallFeed` stories leave Storybook (source adapters remain).
  - `@tangle-network/brand` adds `themes.css`: `[data-theme]` scopes (`aubergine`, `aubergine-light`, `arena`, `arena-light`, `tangle-light`) that re-skin every component through the `@theme` semantic mappings, plus a `Foundations/Theme Showcase` story.

## 0.7.0

### Minor Changes

- e199bc7: Fix the dark theme being unresponsive to token changes + harsh on dark surfaces — root cause was the `@theme` layer.

  - **Single source of truth for semantic tokens.** `theme.css` now maps every shadcn/MD3 utility token (`--color-background/card/border/muted/popover/secondary/accent/destructive/ring/input` + `--color-surface-container*`) onto the `tokens.css` spine via `var()`, instead of leaving them undefined (forcing every app to re-define them) and hardcoding a now-stale `--color-depth-*` copy. Editing the spine in `tokens.css` now actually flows through to `bg-card` / `border-border` / `bg-muted` everywhere.
  - **Comfortable dark surface ladder.** Lift the canvas off near-black (`#0b0b0d` → `#15151a`) and spread the surface/depth/MD3 ladder so panels separate by _fill_, with the border softened (`13%` → `16%` lightness) so it recedes instead of reading as a bright outline on black.

## 0.6.0

### Minor Changes

- c56ea6c: Add a standard `data-theme`/`.dark`/`.light` switch alongside the existing named themes. The dark block now also matches `[data-theme="dark"]`/`.dark` and the light block also matches `[data-theme="light"]`/`.light`, so consumers can pin or toggle a theme with a standard switch instead of an ad-hoc `data-sandbox-theme` name (an unknown name previously fell back to the dark default). The `:root` default stays dark — zero blast radius to existing consumers.

## 0.5.0

### Minor Changes

- 184c8bb: Add the canonical display type scale and semantic type-role utilities. New
  tokens: `--font-size-2xl/3xl/4xl` plus fluid `--font-size-hero`/`--font-size-display`
  (clamp), display line-heights, and tracking tokens. New `@theme` utilities
  `text-display`/`text-hero`/`text-page`/`text-section`/`text-eyebrow`, each
  carrying size + leading + tracking + weight. Quiet weights (heroes 700, titles 600) per Tangle Quiet. Additive — no existing token changed.

## 0.4.0

### Minor Changes

- 8152d92: Tangle Quiet reskin: flat neutral chrome with a single indigo accent. Reworks `theme.css` and `tokens.css` so surfaces read as quiet neutrals and color is reserved for the indigo accent only.

## 0.3.0

### Minor Changes

- 2330781: Repo converted to pnpm monorepo; package contents and exports unchanged.

## 0.2.0 — 2026-05-04

- **Breaking:** stops shipping fonts (`src/styles/fonts.css` removed, `./styles/fonts.css` export removed). Consumer apps must now load fonts themselves via `@fontsource/*` (recommended) or HTML `<link>`. Reasoning:
  - `@import url(...)` inside library CSS breaks downstream when CSS chain-imports get reordered (mirrors `tangle-network/sandbox-ui#28`).
  - Library-shipped Google Fonts requests are privacy-hostile.
  - Consumers cannot fall back when the network fails.
    See README "Fonts" section for migration.
- Selection color updated to teal `rgba(56, 178, 172, 0.22)` for cross-package consistency with sandbox-ui.
- Added GitHub Actions release workflow (`.github/workflows/release.yml`) — auto-publishes to npm and GitHub Packages on `package.json` version bump merged to `main`.

## 0.1.0 — 2026-04-24

Initial release. Extracted from `@tangle-network/sandbox-ui` as the single source of truth for Tangle brand across every app.

- Design tokens: MD3 + shadcn HSL bridge, dark (`:root`) + light (`[data-sandbox-theme="vault"]`)
- Depth stack, status colors, brand accent (indigo), code/syntax palette
- Fonts: Geist / Geist Mono / Outfit / Manrope / Inter via Google Fonts
- Tailwind v4 `@theme` preset: `bg-brand*`, `bg-depth-*`, `text-fg*`, `text-status-*`, font-family + radii
- Logo: `TangleKnot` SVG and `Logo` composed component, sizes `sm | md | lg | xl`, optional suffix
- Base styles + utilities: `.text-gradient-brand`, `.glow-brand`, `.surface-card`, `.bg-mesh`, `.noise`, `.status-dot-*`
