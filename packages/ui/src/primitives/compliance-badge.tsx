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
 * explicitly. The default — and the only HIPAA state surfaces may ship
 * today — is `status="ready"`, which renders "HIPAA-Ready".
 *
 * For HIPAA, `status="compliant"` is reserved for use AFTER the company's
 * documented launch gate closes: business associate agreements executed AND
 * the infrastructure blockers resolved, per
 * compliance/policies/hipaa-security-program.md. Do not pass it before that
 * gate is confirmed closed in the policy record, whatever a page design
 * suggests.
 *
 * That gate is HIPAA's. SOC 2 Type II is an ATTAINED audit, not a pending
 * one — the final report is on file at
 * compliance/evidence/2026-09-01-final-audit — so for `product="soc2"` the
 * filled `status="compliant"` form, "SOC 2 Type II", is legitimate to render
 * today.
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
 * The record is keyed by product so each framework's claim is reviewed copy
 * in one place, not string interpolation at call sites. ISO 27001 slots in
 * the same way when its audit lands.
 */
export type ComplianceProduct = "hipaa" | "soc2";

export interface ComplianceBadgeProps {
  /**
   * Defaults to "ready". For HIPAA, pass "compliant" only after the launch
   * gate closes; for SOC 2 the Type II audit is already attained, so
   * "compliant" is legitimate today.
   */
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
  soc2: {
    ready: "SOC 2",
    compliant: "SOC 2 Type II",
  },
};

/**
 * Outlined while a claim is still being earned (info: still moving), filled
 * once it is attained (success: settled). Both draw from ONE matched token
 * triple — no hardcoded colours — so themes repaint the badge like any other
 * surface.
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
