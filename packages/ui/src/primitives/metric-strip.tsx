import { metricPresentation, metricLayouts } from "../presentation";
import * as React from "react";
import { cn } from "../lib/utils";
import { StatusPill, type StatusTone } from "./status-pill";

/** Headline readings on one plane, with native definition-list semantics. */
export interface MetricStripProps
  extends React.HTMLAttributes<HTMLDListElement> {
  children: React.ReactNode;
  /** Desktop columns. Default retains the existing two / sm:four layout.
   * Five and six use three columns between sm and lg. Never inferred from data. */
  columns?: 3 | 4 | 5 | 6;
}

const MetricStrip = React.forwardRef<HTMLDListElement, MetricStripProps>(
  ({ className, children, columns = 4, ...props }, ref) => (
    <dl
      ref={ref}
      className={cn(
        metricPresentation.strip,
        metricLayouts[columns],
        className,
      )}
      {...props}
    >
      {children}
    </dl>
  ),
);
MetricStrip.displayName = "MetricStrip";

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  /** The qualifying line: which wallet, which window, what the limit is. */
  hint?: React.ReactNode;
  /** Attention is a caller-owned action requirement, never inferred from zero. */
  attention?: { tone: StatusTone; label: string };
  /** Decorative glyph before the label; the label carries the meaning. A
   * direct svg child is sized to 16px; wrap other content to size it yourself. */
  icon?: React.ReactNode;
}

/** A described term; the strip, not this item, decides where separators belong. */
const Metric = React.forwardRef<HTMLDivElement, MetricProps>(
  ({ className, label, value, hint, attention, icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(metricPresentation.item, className)}
      {...props}
    >
      <dt className={metricPresentation.label}>
        {icon != null && icon !== false && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4"
          >
            {icon}
          </span>
        )}
        <span className={metricPresentation.labelText}>{label}</span>
        {attention && (
          <StatusPill tone={attention.tone}>{attention.label}</StatusPill>
        )}
      </dt>
      {/* Values and qualifiers must be readable on touch, not only in a hover
          title. Wrap even unbroken values without making the grid wider. */}
      <dd
        className={cn(
          metricPresentation.value,
          attention?.tone === "danger" && "text-[var(--surface-danger-text)]",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </dd>
      {hint !== undefined && hint !== null && hint !== false && hint !== "" && (
        <dd
          className={metricPresentation.hint}
          title={typeof hint === "string" ? hint : undefined}
        >
          {hint}
        </dd>
      )}
    </div>
  ),
);
Metric.displayName = "Metric";

export { Metric, MetricStrip };
