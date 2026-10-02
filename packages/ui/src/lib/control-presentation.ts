import { focusField } from "./focus";
import { cn } from "./utils";

// Time-valued tokens only: --transition-fast is a legacy duration + easing
// shorthand, not a valid transition-duration. Reuse Brand's scoped vocabulary.
export const controlMotion =
  "duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none motion-reduce:duration-0";

// Explicit opt-in sizes. Legacy defaults and sm/lg/icon sizes stay unchanged.
// Compact follows the consumer's density token; touch does not shrink with it.
export const controlSizes = {
  compact: "h-[var(--control-height)] px-3 py-1 text-sm",
  touch: "h-11 min-h-11 min-w-11 px-4 py-2 text-base",
} as const;

// --input is the shadcn border/track role, NOT a field background. --bg-input
// resolves the recessed well inside every canonical/named light/dark scope.
// An autofill inset shadow coexists with the Tailwind focus ring; never hide
// autofill with a seconds-long background transition or clear the focus halo.
export const fieldPresentation = cn(
  focusField,
  controlMotion,
  "min-w-0 bg-[var(--bg-input)] text-foreground",
  "aria-invalid:border-[var(--surface-danger-border)] aria-invalid:hover:border-[var(--surface-danger-border)] aria-invalid:focus:border-[var(--focus-border-danger)] aria-invalid:focus:ring-[var(--focus-halo-danger)]",
  "autofill:shadow-[inset_0_0_0_1000px_var(--bg-input)] autofill:[-webkit-text-fill-color:var(--text-primary)] autofill:caret-[var(--text-primary)]",
);
