# Control and type scale

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

## Form text

| Role | Primitive | Size | Token | Utility |
| --- | --- | ---: | --- | --- |
| Label | `Label` | 14px, medium | `--font-size-label` | `text-label` |
| Hint or error under a field | `HelpText` (`tone="hint" \| "error"`) | 12px | `--font-size-help` | `text-help` |

`Input` and `Textarea` render their `hint` and `error` props with `HelpText` and point `aria-describedby` at them.
A field composed by hand uses `Label` and `HelpText` and sets `aria-describedby` itself.

## Utilities

Brand's Tailwind theme registers the scale for product code that is not a primitive:

- Heights: `h-control-sm`, `h-control-md`, `h-control-lg` (also `size-*`, `min-h-*`).
- Text: `text-control-sm`, `text-control-md`, `text-control-lg`, `text-label`, `text-help`.
- Titles keep Brand's existing roles: `text-page`, `text-section`, `text-eyebrow`, `text-hero`, `text-display`.

Body and supporting text use Tailwind's steps: `text-xs` 12px, `text-sm` 14px, `text-base` 16px and up.
12px is the floor.

## Enforcement

`tangle-drift` ([drift ratchet](drift-ratchet.md)) counts, per product surface, the source that bypasses this scale:

| Metric | Counts |
| --- | --- |
| `font_size_literal` | `text-[13px]`, inline `fontSize: 13`, CSS `font-size: 13px` |
| `size_literal` | `h-[34px]`, `min-h-[2.5rem]`, `size-[30px]` |
| `native_control` | `<button>`, `<input>`, `<select>`, `<textarea>` in product code |
| `control_override` | `<Button className="h-8 px-3 text-xs">` and the same on `Input`, `Textarea`, `SelectTrigger` |

Each count may only fall. Token references such as `h-[var(--control-height-sm)]` and `text-[length:var(--control-text-md)]` are not counted.

## Migrating a product

1. Replace a local button class, CSS `.btn` rule or one-off `<button className="h-8 …">` with `Button` at a size.
2. Drop `className` height, padding, text-size and corner overrides on shared controls; pick the size that matches the row.
3. Put a row's controls on one size: an `sm` button beside a default field is a 4px mismatch.
4. Replace literal font sizes with a scale step or role utility, and literal heights with `h-control-*`.
5. Lower the surface's drift baseline after the change reaches the default branch.
