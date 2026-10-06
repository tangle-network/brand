import * as React from "react";
import { cn } from "../lib/utils";
import { StatusPill, type StatusTone } from "./status-pill";

// Each finite preset owns its grid AND its row-start rules. Keep the strings
// literal so host Tailwind consumers scanning the published source emit them.
// Ranges do not overlap: no drawn border is subsequently suppressed.
const layouts = {
  3: "grid-cols-2 sm:grid-cols-3 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:[&>div:not(:nth-child(3n+1))]:border-l",
  4: "grid-cols-2 sm:grid-cols-4 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:[&>div:not(:nth-child(4n+1))]:border-l",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l lg:[&>div:not(:nth-child(5n+1))]:border-l",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l lg:[&>div:not(:nth-child(6n+1))]:border-l",
} as const;

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
        "grid min-w-0 rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-card)]",
        layouts[columns],
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
  /** Decorative glyph before the label; the label carries the meaning. */
  icon?: React.ReactNode;
}

/** A described term; the strip, not this item, decides where separators belong. */
const Metric = React.forwardRef<HTMLDivElement, MetricProps>(
  ({ className, label, value, hint, attention, icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("min-w-0 border-border p-4 sm:p-5", className)}
      {...props}
    >
      <dt className="flex min-w-0 flex-wrap items-center gap-2 text-muted-foreground text-sm">
        {icon && (
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4"
          >
            {icon}
          </span>
        )}
        <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{label}</span>
        {attention && (
          <StatusPill tone={attention.tone}>{attention.label}</StatusPill>
        )}
      </dt>
      {/* Values and qualifiers must be readable on touch, not only in a hover
          title. Wrap even unbroken values without making the grid wider. */}
      <dd
        className={cn(
          "mt-1 whitespace-normal [overflow-wrap:anywhere] font-semibold text-xl tabular-nums tracking-tight lg:text-2xl",
          attention?.tone === "danger" && "text-[var(--surface-danger-text)]",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </dd>
      {hint !== undefined && hint !== null && hint !== false && hint !== "" && (
        <dd
          className="mt-0.5 whitespace-normal [overflow-wrap:anywhere] text-[var(--text-dim)] text-xs"
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
