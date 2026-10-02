import * as React from "react";
import { cn } from "../lib/utils";

/** Visual roles ported from sandbox-ui/src/primitives/heading.tsx. */
export type HeadingVariant =
  | "display"
  | "hero"
  | "page"
  | "section"
  | "subsection"
  | "eyebrow";

// Keep Brand's existing size, leading, tracking and weight tokens. The literal
// fallbacks are the existing Sandbox treatment, not a second type scale.
const VARIANT_CLASS: Record<HeadingVariant, string> = {
  display:
    "font-display font-bold text-foreground text-[length:var(--font-size-display,3rem)] leading-[var(--line-height-display,1.05)] tracking-[var(--tracking-tight,-0.02em)]",
  hero: "font-display font-bold text-foreground text-[length:var(--font-size-hero,2.5rem)] leading-[1.1] tracking-[var(--tracking-tight,-0.02em)]",
  page: "font-display font-semibold text-foreground text-[length:var(--font-size-3xl,1.875rem)] leading-[var(--line-height-heading,1.15)] tracking-[var(--tracking-tight,-0.02em)]",
  section:
    "font-display font-semibold text-foreground text-[length:var(--font-size-xl,1.25rem)] leading-[1.3] tracking-[var(--tracking-snug,-0.01em)]",
  subsection:
    "font-semibold text-foreground text-[length:var(--font-size-lg,1rem)] leading-[1.4]",
  eyebrow:
    "font-semibold uppercase text-muted-foreground text-[length:var(--font-size-sm,0.75rem)] leading-none tracking-[var(--tracking-wide,0.08em)]",
};

const DEFAULT_TAG: Record<HeadingVariant, React.ElementType> = {
  display: "h1",
  hero: "h2",
  page: "h1",
  section: "h2",
  subsection: "h3",
  eyebrow: "p",
};

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "role"> {
  /** Visual treatment, independent of the rendered element. Defaults to section. */
  variant?: HeadingVariant;
  /** Semantic element; changing it does not change the visual variant. */
  as?: React.ElementType;
  /**
   * Native ARIA role, or Sandbox's existing visual-role input. Only the six
   * legacy visual values are consumed; they are never emitted as ARIA roles.
   * Prefer variant for new code. An explicit variant wins over a legacy role.
   */
  role?: React.AriaRole | HeadingVariant;
}

/**
 * One renderer for page, section and card titles. Use at most one default
 * display/page h1 per page; choose `as` according to the document hierarchy.
 */
const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  ({ variant, role, as, className, ...props }, ref) => {
    const legacyVariant =
      role && Object.prototype.hasOwnProperty.call(VARIANT_CLASS, role)
        ? (role as HeadingVariant)
        : undefined;
    const visualVariant = variant ?? legacyVariant ?? "section";
    const Tag = as ?? DEFAULT_TAG[visualVariant];

    return (
      <Tag
        ref={ref}
        className={cn("[overflow-wrap:anywhere]", VARIANT_CLASS[visualVariant], className)}
        role={legacyVariant ? undefined : role}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

export { Heading };
