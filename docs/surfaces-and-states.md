# Surfaces and interaction states

Shared principles and craft/runtime acceptance live in the [design bible](design-bible.md). This document owns the implementation contract.

A page reads as a hierarchy only when each plane steps off the one it sits on, and every interactive thing answers the pointer the same way.
Brand owns the ladder and the state palette (`tokens.css`, `named-themes.css`); `@tangle-network/ui` owns the primitives that apply them (`lib/interaction.ts`).
A product uses the primitives; it never paints a plane or a hover by hand.

## The ladder

Each level has a token. A card is one level; what it contains is the next.

| Level | Token | Paints |
| --- | --- | --- |
| page | `--hsl-background` | the canvas |
| sidebar | `--sidebar-background` | the rail |
| card | `--hsl-card` | `Card`, `bg-card` |
| raised | `--hsl-raised` | a card or `bg-card` box inside a card |
| raised-2 | `--hsl-raised-2` | a card inside that |
| popover | `--hsl-popover` | `SelectContent`, `DropdownMenuContent` (a portal never takes the card level) |
| well | `--well-page`, `--well-card`, `--well-raised`, `--well-raised-2` | a field's fill on each level |
| field border | `--field-border` | a field's hairline, at least 3:1 against the card |
| hairline | `--hsl-border` | dividers and card edges |

Elevation tokens: `--shadow-card` (level 1), `--shadow-raised` (nested), `--shadow-well` (inset, fields) and `--edge-highlight` (a 1px top highlight on dark planes; transparent in light).

### Surface context

`Card` renders `data-slot="card"`. One brand rule in `tokens.css`, keyed only on that attribute, re-declares two context variables for everything inside a card:

- `--card` becomes `--hsl-raised` one level in and `--hsl-raised-2` two levels in, so a nested `Card` or `bg-card` box steps without a prop.
- `--well` becomes `--well-card`, then `--well-raised`, then `--well-raised-2`, so a field is never the colour of its parent: in light it is the opposite step from its parent, in dark it always sits deeper.

Fields read `--well` through `ixField`. `Toolbar` still sets `--field-surface` to lift its filters onto the card surface.

### Values

Hospitality is the first theme on the tuned ladder (OKLCH L x100, gated in `surface-ladder.test.ts`):

| Level | Light | Dark |
| --- | ---: | ---: |
| page | 91.6 `#dee6dc` | 16.9 `#0d100e` |
| sidebar | 96.9 `#f2f6f1` | 21.6 `#171b17` |
| card | 100 `#ffffff` + shadow | 31.1 `#2d322e` (1.46:1 on the page) |
| raised | 95.6 `#edf2ec` | 37.9 `#3e443f` + top highlight |
| raised-2 | 100 `#ffffff` | 43.9 `#4e544f` |
| popover | 100 `#ffffff` + shadow | 42.0 `#494f4a` |
| well on page / in card | 100 / 94.9 `#ebf0e9` | 12.4 `#050705` / 12.4 |
| well in raised / raised-2 | 100 / 94.9 | 22.1 `#181c18` / 22.1 |
| hairline | 85.0 `#c9d0c7` | 42.0 `#494f4a` |
| field border | 60.0 `#798479` | 64.0 `#868f87` |

Rules: every adjacent pair is at least 4.4 L apart (a card or field within 3 of its parent reads as flat); dark wells sit at least 4.5 below what holds them; field borders clear 3:1 against the card (WCAG 1.4.11).
Inks follow the planes: Hospitality's dark accent text (`#b2dbc2`) and dark destructive red (`0 80% 88%`) are lighter than the canonical ones so selected text on a tint and error text on the popover keep 4.5:1.
The canonical spine and other named themes default every new token to today's look: raised levels paint `--hsl-card`, every well is `--bg-input`, and `--field-border` is the hairline. Their tuned values land separately.

## The four interaction states

All four derive from the focus ring hue `--hsl-ring`, so one green (Hospitality) or one indigo (the spine) marks every interactive thing, and the keyboard focus-visible glow (`focusRing`, `focusField`) is unchanged.

| State | Token | Shape |
| --- | --- | --- |
| hover | `--ix-hover`, `--ix-hover-border` | 1px edge at .45 plus a 4px halo at .16; the border shifts to the ring at .70 |
| press | `--ix-press` | 1px edge at .95 plus a 4px halo at .30 |
| after click | `--ix-after` | a mouse-focused control keeps a 1px .60 / 3px .14 ring (`:focus:not(:focus-visible)`) |
| selected | `--ix-sel-bg`, `--ix-sel-ring` | a .13 tint (.18 in dark) with a 1px inset ring at .85 |
| focus-visible | `--focus-border`, `--focus-halo` | unchanged |

A soft wash, `--ix-hover-bg` (.07 light, .08 dark), replaces the glow where a glow would be noise.

### Which helper each primitive takes

| Primitive | Helper |
| --- | --- |
| `Button` default, destructive, destructive-outline, secondary, outline, sandbox | `ixControl` |
| `Button` ghost, link, bare | `ixControlSoft` (wash, never the glow) |
| `Button` with `aria-pressed` | `ixControl` + `ixSelected` |
| `Input`, `Textarea` | `ixField` + focusField's `:focus` border and halo |
| `focusFieldWithin` (search wrapper, composer) | `ixField` + its has-focus ring; the inner bare field stays transparent |
| `SelectTrigger` | `ixField` + `ixControlAfter`; open keeps the well and shows the after ring |
| `SelectItem`, `DropdownMenuItem` / `CheckboxItem` / `RadioItem` / `SubTrigger` | `ixRow` |
| `SelectContent`, `DropdownMenuContent` | `bg-popover` + `--edge-highlight`, `--shadow-card` |
| `Card` | `data-slot="card"` + `--edge-highlight`, `--shadow-card`; `hover` or `interactive` adds `ixControl` |
| `CardDescription` | `line-clamp-2` as a guard; short copy is the fix |
| `SegmentedControl` row | well track; items `ixControlSoft` + `ixSelected` |
| `SegmentedControl` tabs, `TabsTrigger` underline | `ixTabUnderline` |
| `TabsTrigger` default, pills | `ixControlSoft` + `ixSelected` |

A product list row (sidebar nav, conversation rows, table rows) uses `ixRow` + `ixSelected` with `aria-current="page"` on the current item.
`interaction-states.test.tsx` holds each primitive to its helper and compiles every helper class with Tailwind.

## Status

`StatusPill` tones map to `--surface-{tone}-{bg,text,border}`. Hospitality retunes the success, warning, danger and neutral triples for its planes; the meaning is the same everywhere.

| State | Tone | Label |
| --- | --- | --- |
| Connected | `success` | "Connected" |
| Not connected, not set up, unavailable | `neutral` | "Not connected", "Not available" |
| Error, failed, disconnected by provider | `danger` | "Error", "Failed" |
| Pending, connecting, needs approval, incomplete | `warning` | "Pending", "Needs setup" |
| Running work | `running` / `info` | canonical blue |

Amber means pending only: "Not connected" and "Not available" are never `warning`.
Hospitality light fills sit at L 91–93 (at least 7 under the white card) and dark fills at L 37–38 (about 6 over the card), each with text at 5:1 or better, so a status box never reads as a flat card.
