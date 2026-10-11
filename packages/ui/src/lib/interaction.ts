/**
 * The interaction states every control shares: one palette in five shapes, all
 * read from `@tangle-network/brand`'s `--ix-*` tokens (tokens.css), which derive
 * from the focus ring hue `--hsl-ring`. So hover, press, after-click and
 * selected are the same green in Hospitality and the same indigo on the spine
 * as the keyboard focus ring.
 *
 *   hover     1px edge at .45 plus a 4px halo at .16 (`--ix-hover`)
 *   press     1px edge at .95 plus a 4px halo at .30 (`--ix-press`)
 *   after     a control focused by a mouse click keeps a soft ring (`--ix-after`)
 *   selected  a tint plus a 1px inset ring at .85 (`--ix-sel-bg`, `--ix-sel-ring`)
 *
 * The keyboard focus-visible glow stays exactly as `focusRing` / `focusField`
 * (lib/focus.ts) draw it. Tailwind composes `--tw-ring-shadow` with
 * `--tw-shadow`, so these shadows coexist with that ring, and
 * `focus-visible:shadow-none` drops the hover glow while the keyboard ring shows.
 *
 * Every class is written out in full because Tailwind reads class names
 * statically.
 */

/** Bordered or filled control: green edge on hover, deeper on press, a persistent soft ring after a mouse click. */
export const ixControl =
  "hover:border-[var(--ix-hover-border)] hover:shadow-[var(--ix-hover)] " +
  "focus:not-focus-visible:border-[var(--ix-hover-border)] focus:not-focus-visible:shadow-[var(--ix-after)] " +
  "active:border-[hsl(var(--hsl-ring))] active:shadow-[var(--ix-press)] focus-visible:shadow-none";

/** The after-click part of `ixControl` alone, for a field that opens a menu (SelectTrigger). */
export const ixControlAfter =
  "focus:not-focus-visible:border-[var(--ix-hover-border)] focus:not-focus-visible:shadow-[var(--ix-after)]";

/** Ghost, icon, link and bare controls: a wash, never a glow (too noisy in sidebars and toolbars). */
export const ixControlSoft = "hover:bg-[var(--ix-hover-bg)] active:bg-[var(--ix-sel-bg)]";

/**
 * Field: its own well and a visible border; hover replaces `focusField`'s
 * neutral `--border-strong`. The well is the `--well` context variable, which a
 * card re-declares for its descendants, so a field never takes its parent's
 * colour. `--field-surface` still lets a context such as Toolbar pick the fill.
 */
export const ixField =
  "bg-[var(--field-surface,var(--well))] border-[var(--field-border)] shadow-[var(--shadow-well)] " +
  "hover:border-[var(--ix-hover-border)] hover:shadow-[var(--shadow-well),var(--ix-hover)]";

/** Selected / on / current: tint plus a 1px inset green ring. */
export const ixSelected =
  "aria-pressed:bg-[var(--ix-sel-bg)] aria-pressed:text-[var(--accent-text)] aria-pressed:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)] " +
  "aria-checked:bg-[var(--ix-sel-bg)] aria-checked:text-[var(--accent-text)] aria-checked:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)] " +
  "aria-[current=page]:bg-[var(--ix-sel-bg)] aria-[current=page]:text-[var(--accent-text)] aria-[current=page]:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)] " +
  "data-[state=on]:bg-[var(--ix-sel-bg)] data-[state=on]:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)] " +
  "data-[state=active]:bg-[var(--ix-sel-bg)] data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)]";

/** Underline tab: 2px green underline plus a faint tint, never a box; a faint underline on hover. */
export const ixTabUnderline =
  "hover:shadow-[inset_0_-2px_0_hsl(var(--hsl-ring)/0.4)] " +
  "data-[state=active]:bg-[hsl(var(--hsl-ring)/0.07)] data-[state=active]:text-[var(--accent-text)] data-[state=active]:shadow-[inset_0_-2px_0_var(--ix-sel-ring)] " +
  "aria-checked:bg-[hsl(var(--hsl-ring)/0.07)] aria-checked:text-[var(--accent-text)] aria-checked:shadow-[inset_0_-2px_0_var(--ix-sel-ring)]";

/** List row / menu item: wash plus inset edge on hover or keyboard highlight; checked = selected. */
export const ixRow =
  "hover:bg-[var(--ix-hover-bg)] hover:shadow-[inset_0_0_0_1px_var(--ix-hover-border)] " +
  "data-[highlighted]:bg-[var(--ix-sel-bg)] data-[highlighted]:shadow-[inset_0_0_0_1px_var(--ix-hover-border)] " +
  "focus:bg-[var(--ix-sel-bg)] data-[state=checked]:bg-[var(--ix-sel-bg)] data-[state=checked]:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)] " +
  "active:shadow-[inset_0_0_0_1px_hsl(var(--hsl-ring))]";
