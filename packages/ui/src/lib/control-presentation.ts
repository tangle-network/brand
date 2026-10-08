import { focusField } from "./focus";
import { cn } from "./utils";

// Time-valued tokens only: --transition-fast is a legacy duration + easing
// shorthand, not a valid transition-duration. Reuse Brand's scoped vocabulary.
export const controlMotion =
  "duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none motion-reduce:duration-0";

/**
 * The control scale. Button, Input, Textarea and SelectTrigger take the same
 * `sm | md | lg` sizes and read the same Brand tokens, so any row of controls
 * at one size shares a height, a text size and a corner. md follows the
 * `--control-height` density knob. The fallbacks keep an app on an older
 * Brand stylesheet at the same pixels.
 */
export type ControlSize = "sm" | "md" | "lg";

export const controlHeight = {
  sm: "h-[var(--control-height-sm,2rem)]",
  md: "h-[var(--control-height,2.25rem)]",
  lg: "h-[var(--control-height-lg,2.75rem)]",
} as const satisfies Record<ControlSize, string>;

export const controlText = {
  sm: "text-[length:var(--control-text-sm,0.75rem)]",
  md: "text-[length:var(--control-text-md,0.875rem)]",
  lg: "text-[length:var(--control-text-lg,1rem)]",
} as const satisfies Record<ControlSize, string>;

export const controlRadius = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-lg",
} as const satisfies Record<ControlSize, string>;

/** Square icon-only controls on the same heights. */
export const controlSquare = {
  sm: "size-[var(--control-height-sm,2rem)]",
  md: "size-[var(--control-height,2.25rem)]",
  lg: "size-[var(--control-height-lg,2.75rem)]",
} as const satisfies Record<ControlSize, string>;

/**
 * Field text never drops below 16px on a coarse pointer: iOS Safari zooms the
 * page on focus for anything smaller.
 */
export const fieldTouchText = "pointer-coarse:text-base";

/** Field sizes: the control scale with field padding. */
export const fieldSizes = {
  sm: cn(controlHeight.sm, controlText.sm, controlRadius.sm, "px-2.5"),
  md: cn(controlHeight.md, controlText.md, controlRadius.md, "px-3"),
  lg: cn(controlHeight.lg, controlText.lg, controlRadius.lg, "px-4"),
} as const satisfies Record<ControlSize, string>;

// Explicit opt-in sizes kept for existing callers. Compact follows the
// consumer's density token (md); touch is lg with a guaranteed 44px minimum.
export const controlSizes = {
  compact: "h-[var(--control-height)] px-3 py-1 text-sm",
  touch: "h-11 min-h-11 min-w-11 px-4 py-2 text-base",
} as const;

// --input is the shadcn border/track role, NOT a field background. --bg-input
// resolves the recessed well inside every canonical/named light/dark scope.
// An autofill inset shadow coexists with the Tailwind focus ring; never hide
// autofill with a seconds-long background transition or clear the focus halo.
// --field-surface lets a context raise its fields: Toolbar sets it to the card
// surface so filters on the page canvas read as controls, not as holes in it.
export const fieldPresentation = cn(
  focusField,
  controlMotion,
  "min-w-0 bg-[var(--field-surface,var(--bg-input))] text-foreground",
  "aria-invalid:border-[var(--surface-danger-border)] aria-invalid:hover:border-[var(--surface-danger-border)] aria-invalid:focus:border-[var(--focus-border-danger)] aria-invalid:focus:ring-[var(--focus-halo-danger)]",
  "autofill:shadow-[inset_0_0_0_1000px_var(--bg-input)] autofill:[-webkit-text-fill-color:var(--text-primary)] autofill:caret-[var(--text-primary)]",
);
