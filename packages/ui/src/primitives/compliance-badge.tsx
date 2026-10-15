import * as React from "react";
import { TangleKnot } from "@tangle-network/brand";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

/**
 * The one compliance badge every public surface uses, so the claim a page
 * makes is chosen here and nowhere else.
 *
 * Copy discipline is the point of the component. There is NO official HIPAA
 * certification a product can hold, so the badge never says "certified", and
 * it renders "HIPAA Compliant" ONLY when a caller passes `status="compliant"`
 * explicitly. The default — and the only state surfaces may ship today — is
 * `status="ready"`, which renders "HIPAA-Ready".
 *
 * `status="compliant"` is reserved for use AFTER the company's documented
 * launch gate closes: business associate agreements executed AND the
 * infrastructure blockers resolved, per
 * compliance/policies/hipaa-security-program.md. Do not pass it before that
 * gate is confirmed closed in the policy record, whatever a page design
 * suggests.
 *
 * The claim is told three ways, matching StatusPill's doctrine: the LABEL
 * text itself ("HIPAA-Ready" vs "HIPAA Compliant"), the FILL (outlined vs
 * filled), and the TONE (the info triple while the gate is open, the success
 * triple once it closes). Each status paints from one matched `--surface-*`
 * token triple, so the text colour is solved against a known plane; the
 * outlined "ready" form keeps the triple's text and border, which clear the
 * 4.5:1 body floor on the page canvas, on a transparent fill.
 *
 * The Tangle mark is decorative: the label already carries the whole claim,
 * so the mark is hidden from the accessibility tree and the badge's own
 * `aria-label` states the claim.
 */
export type ComplianceStatus = "ready" | "compliant";

/**
 * Only HIPAA exists today. The record is keyed by product so SOC 2 and ISO
 * 27001 slot in as new entries with their own reviewed copy, not as string
 * interpolation at call sites.
 */
export type ComplianceProduct = "hipaa";

export interface ComplianceBadgeProps {
  /** Defaults to "ready"; "compliant" only after the launch gate closes. */
  status?: ComplianceStatus;
  product?: ComplianceProduct;
  size?: "sm" | "md";
  /** Renders the badge as a link, e.g. to the trust or compliance page. */
  href?: string;
  className?: string;
  id?: string;
  title?: string;
}

const PRODUCT_COPY: Record<
  ComplianceProduct,
  Record<ComplianceStatus, string>
> = {
  hipaa: {
    ready: "HIPAA-Ready",
    compliant: "HIPAA Compliant",
  },
};

/**
 * Outlined while the gate is open (info: still moving), filled once it closes
 * (success: settled). Both draw from ONE matched token triple — no hardcoded
 * colours — so themes repaint the badge like any other surface.
 */
const STATUS_SURFACE: Record<ComplianceStatus, string> = {
  ready:
    "border-[var(--surface-info-border)] bg-transparent text-[var(--surface-info-text)]",
  compliant:
    "border-[var(--surface-success-border)] bg-[var(--surface-success-bg)] text-[var(--surface-success-text)]",
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
} as const;

const MARK_SIZE = { sm: 12, md: 14 } as const;

function ComplianceBadge({
  status = "ready",
  product = "hipaa",
  size = "sm",
  href,
  className,
  ...props
}: ComplianceBadgeProps) {
  const label = PRODUCT_COPY[product][status];
  const classes = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium",
    SIZE_CLASSES[size],
    STATUS_SURFACE[status],
    href && focusRing,
    className,
  );
  const mark = (
    <span className="inline-flex shrink-0" aria-hidden="true">
      <TangleKnot size={MARK_SIZE[size]} />
    </span>
  );

  if (href) {
    return (
      <a href={href} aria-label={label} className={classes} {...props}>
        {mark}
        {label}
      </a>
    );
  }

  return (
    <span aria-label={label} className={classes} {...props}>
      {mark}
      {label}
    </span>
  );
}

export { ComplianceBadge };
