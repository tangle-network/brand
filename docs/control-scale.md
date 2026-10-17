# Control and type scale

Shared principles and craft/runtime acceptance live in the [design bible](design-bible.md). This document owns the implementation contract.

One scale sizes every control and form text in Tangle products.
Brand owns the tokens; `@tangle-network/ui` owns the primitives that read them; Sandbox UI and Agent App re-export or compose those primitives.
A product picks a size name, never a pixel value.

## Sizes

`Button`, `Input`, `Textarea` and `SelectTrigger` take the same `size`, so a row of controls at one size shares a height, a text size and a corner.

| Size | Height | Text | Corner | Token |
| --- | ---: | ---: | --- | --- |
| `sm` | 32px | 12px | `rounded-md` | `--control-height-sm`, `--control-text-sm` |
| `md` (default) | 36px | 14px | `rounded-lg` | `--control-height`, `--control-text-md` |
| `lg` | 44px | 16px | `rounded-lg` | `--control-height-lg`, `--control-text-lg` |

- Every control defaults to `md`. Before this scale, a default `Input` was 44px beside a 36px default `Button` and `SelectTrigger`.
- Icon-only buttons use `icon-sm`, `icon` and `icon-lg`: squares on the same three heights.
- `md` reads `--control-height`, the density knob; set it on a subtree to make that region denser or roomier.
- Fields (`Input`, `Textarea`, `SelectTrigger`) render 16px text on a coarse pointer at every size, because iOS Safari zooms the page when a field under 16px takes focus.
- `compact` and `touch` remain for existing callers: `compact` is `md` with tighter padding; `touch` is at least 44px with 16px text. `Button` keeps `xl` (52px) for a display call to action outside the scale.
- A `Textarea` keeps its 120px minimum height; its size sets text, padding and corner.

## Shell header

Every header row in the app shell is `--shell-header-height` (56px) tall: the sidebar rail's top row, the main pane's header, side panels, drawers and the assistant panel. Their bottom dividers therefore share one y, so the main header's underline continues the sidebar's.

- Sandbox UI's `ShellHeader` is the row; products put content in it and never set its height. Tailwind code that is not the primitive uses `h-shell-header`.
- An inset pane (Agent App's conversation companion) sits one `--shell-inset-gutter` plus its 1px border below the shell top, so `ShellHeader inset` is shorter by exactly that amount and its divider still lands on the shared y.
- `tangle-drift` counts a header row given its own height (`header_height_literal`); each surface ratchets to 0.

## Transcript text

The person's and the agent's messages use one family, size and leading: `--transcript-font-size` (16px, the chat reading size) and `--transcript-line-height` (1.6), applied by `tangle-transcript-text`. They differ only by alignment and surface. UI's `AgentTimeline`, `UserMessage` and `ChatMessage` apply it through the exported `TRANSCRIPT_TEXT`; a product that wants a roomier transcript sets the two tokens on a subtree, never a rule on `.tangle-prose` (`transcript_type_override`).

## Dates, times and pressables

- `DatePicker` replaces `<input type="date">`: a trigger on the scale that opens `Calendar` (a keyboard-navigable month grid) and reports `YYYY-MM-DD`; it shows the date in the viewer's locale, never a `mm/dd/yyyy` mask. `Calendar` stands alone for inline pickers.
- `TimeSelect` replaces `<input type="time">`: a Select of `step`-minute slots (default 15) that reports `HH:MM`.
- `Checkbox` and `RadioGroup` replace native checkbox and radio inputs.
- `Button variant="bare"` is for rows, tiles and pills that draw their own layout: it keeps the shared focus ring and disabled behavior and adds no surface or size. Anything that reads as a button uses a styled variant.

## Field surfaces

Fields fill with the well for the level they sit on (`--well`, re-declared by each card level) and draw a `--field-border` hairline; see [surfaces and interaction states](surfaces-and-states.md) for the ladder, the hover, press, after-click and selected states, and which helper each primitive takes. `Toolbar` sets `--field-surface` to the card surface, so every field inside it (Input, SelectTrigger, DatePicker, TimeSelect) reads as a raised control with its border and focus ring. Filter rows belong in `Toolbar` with `FilterField` labels.

## Form text

| Role | Primitive | Size | Token | Utility |
| --- | --- | ---: | --- | --- |
| Label | `Label` | 14px, medium | `--font-size-label` | `text-label` |
| Hint or error under a field | `HelpText` (`tone="hint" \| "error"`) | 12px | `--font-size-help` | `text-help` |

`Input` and `Textarea` render their `hint` and `error` props with `HelpText` and point `aria-describedby` at them.
A field composed by hand uses `Label` and `HelpText` and sets `aria-describedby` itself.

## Settings pages

Settings compose four primitives from `@tangle-network/ui/primitives`, all at the 14px floor (section titles 16px) with controls at `md`:

- `SettingsSection` is one card per group (at most four per page section), with an anchor `id`, an optional one-line description, top-right actions, a `danger` tone and a footer.
- `SettingsRow` is one setting: label left, control right (`inline`), on the label's line (`compact`, for switches and single buttons) or under it (`stacked`). Its status sits after the label; an `error` or `disabledReason` replaces the description and is wired to the control through `fieldMessageId(htmlFor)`.
- `SettingsList` and `SettingsListItem` are comparable rows with aligned state and action columns; destructive actions live only in the item's ⋯ menu.
- `Field` is a labelled field for forms that are not rows, with the same message wiring.

Rows and lists respond to their card's width, not the viewport's. `PageShell measure="settings"` frames the page: a 13rem section column beside a 48rem article from 60rem of frame width, and a 56px tab strip below that.

## Utilities

Brand's Tailwind theme registers the scale for product code that is not a primitive:

- Heights: `h-control-sm`, `h-control-md`, `h-control-lg` (also `size-*`, `min-h-*`).
- Text: `text-control-sm`, `text-control-md`, `text-control-lg`, `text-label`, `text-help`.
- Titles keep Brand's existing roles: `text-page`, `text-section`, `text-eyebrow`, `text-hero`, `text-display`.
- A page title is `PageHeader` from `@tangle-network/ui/primitives` (30px, `text-page`), with its description, actions and meta slots; `level={2}` gives a nested section header. Products do not write their own `<h1>`.

Body and supporting text use Tailwind's steps: `text-xs` 12px, `text-sm` 14px, `text-base` 16px and up.
12px is the floor.

## Enforcement

`tangle-drift` ([drift ratchet](drift-ratchet.md)) counts, per product surface, the source that bypasses this scale:

| Metric | Counts |
| --- | --- |
| `font_size_literal` | `text-[13px]`, inline `fontSize: 13`, CSS `font-size: 13px` |
| `size_literal` | `h-[34px]`, `min-h-[2.5rem]`, `size-[30px]` |
| `native_control` | `<button>`, `<input>` (not `type="hidden"`), `<select>`, `<textarea>` in product code |
| `control_override` | `<Button className="h-8 px-3 text-xs">` and the same on `Input`, `Textarea`, `SelectTrigger` |
| `page_heading` | a hand-written `<h1>` instead of `PageHeader` |
| `header_height_literal` | a header row with its own `height`/`min-height` (`.x-header { min-height: 66px }`, `<header className="h-16">`) instead of `ShellHeader` |
| `transcript_type_override` | product CSS setting font size, leading or family on `.tangle-prose` or a timeline step |

Each count may only fall. Token references such as `h-[var(--control-height-sm)]` and `text-[length:var(--control-text-md)]` are not counted.

## Migrating a product

1. Replace a local button class, CSS `.btn` rule or one-off `<button className="h-8 …">` with `Button` at a size.
2. Drop `className` height, padding, text-size and corner overrides on shared controls; pick the size that matches the row.
3. Put a row's controls on one size: an `sm` button beside a default field is a 4px mismatch.
4. Replace literal font sizes with a scale step or role utility, and literal heights with `h-control-*`.
5. Replace a hand-written page `<h1>` with `PageHeader`, moving the page's primary actions into its `actions` slot.
6. Lower the surface's drift baseline after the change reaches the default branch.
