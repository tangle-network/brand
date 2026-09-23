/**
 * The focus treatment every control shares, in two shapes over one palette
 * (`--focus-border`, `--focus-halo` and `--border-strong` from
 * `@tangle-network/brand`'s tokens.css).
 *
 * A FIELD — input, textarea, select trigger, composer — shows focus on its own
 * border: the hairline shifts to `--focus-border` and a 3px `--focus-halo` ring
 * spreads outside it. It keys off `:focus`, because a caret in a field needs the
 * cue whether the field was clicked or tabbed into.
 *
 * A CONTROL — button, tab, switch, link, card — has no border to shift, so it
 * draws a 1px `--focus-border` outline with the same 3px halo beyond it. It keys
 * off `:focus-visible`, so a mouse click leaves no ring.
 *
 * The halo is a Tailwind ring, which renders as box-shadow: it follows
 * border-radius and never moves layout, and a consumer removes it with
 * `focus:ring-0` / `focus-visible:ring-0`, which tailwind-merge resolves against
 * these classes. The control's line is an outline so that forced-colors mode,
 * which drops box-shadows, still paints it. A field has its border for that, so
 * it hides the outline with `outline-hidden`, which stays transparent-but-present
 * in forced-colors mode.
 */

/**
 * Resting hairline, neutral hover, and `:focus` border plus halo for a text
 * field. The hover is a plain `hover:` class so a consumer's `hover:border-*`
 * replaces it through tailwind-merge; the focus border outranks it because
 * Tailwind emits `focus:` after `hover:`.
 */
export const focusField =
  "border-border transition-[border-color,box-shadow] duration-150 ease-out hover:border-[var(--border-strong)] focus:outline-hidden focus:border-[var(--focus-border)] focus:ring-3 focus:ring-[var(--focus-halo)]";

/**
 * The field treatment for a container that wraps a borderless field, such as a
 * composer around a textarea and its buttons. It lights while a FIELD inside
 * has focus: a text input, textarea, select or contenteditable editor. A
 * focused button, checkbox or button-type input inside the container shows only
 * its own ring, so a click on the send button does not read as field focus and
 * a tab to it does not stack two indicators. The field selector is written out
 * in full because Tailwind reads class names statically.
 */
export const focusFieldWithin =
  "border-border transition-[border-color,box-shadow] duration-150 ease-out hover:border-[var(--border-strong)] has-[:is(textarea,select,[contenteditable]:not([contenteditable=false]),input:not([type=button],[type=submit],[type=reset],[type=image],[type=checkbox],[type=radio],[type=range],[type=color],[type=file])):focus]:border-[var(--focus-border)] has-[:is(textarea,select,[contenteditable]:not([contenteditable=false]),input:not([type=button],[type=submit],[type=reset],[type=image],[type=checkbox],[type=radio],[type=range],[type=color],[type=file])):focus]:ring-3 has-[:is(textarea,select,[contenteditable]:not([contenteditable=false]),input:not([type=button],[type=submit],[type=reset],[type=image],[type=checkbox],[type=radio],[type=range],[type=color],[type=file])):focus]:ring-[var(--focus-halo)]";

/** Error state for a field: a danger hairline and the same focus shape in danger. Compose after `focusField`. */
export const focusFieldInvalid =
  "border-[var(--surface-danger-border)] hover:border-[var(--surface-danger-border)] focus:border-[var(--focus-border-danger)] focus:ring-[var(--focus-halo-danger)]";

const focusRingBase =
  "focus-visible:outline-1 focus-visible:outline-[var(--focus-border)] focus-visible:ring-4 focus-visible:ring-[var(--focus-halo)]";

/** Keyboard-only focus for a control: a 1px focus line with the halo beyond it. */
export const focusRing = `${focusRingBase} focus-visible:outline-offset-0`;

/**
 * `focusRing` drawn inside the box, for a control flush against a scroll
 * container or its neighbours (a tab strip, a list row), where an outer ring
 * would be clipped or would overlap them.
 */
export const focusRingInset = `${focusRingBase} focus-visible:-outline-offset-1 focus-visible:ring-inset`;
