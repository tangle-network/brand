import * as React from "react";
import { cn } from "../lib/utils";
import { StatusPill, type StatusTone } from "./status-pill";

/**
 * The headline figures for a console page, as ONE statement rather than four.
 *
 * A row of separate stat cards is the default and it is usually wrong here.
 * Each card is a box that must be tall enough for its longest member, so a row
 * mixing "$248.55 / Personal wallet" against a bare "0" leaves the short ones
 * mostly empty; and four bordered boxes read as four unrelated facts when they
 * are four readings of one account. `MetricStrip` puts them on one plane
 * divided by hairlines: same information, one object, no holes.
 *
 * The divider is a border on the item rather than a `divide-*` utility on the
 * parent, because these wrap. `divide-x` draws from DOM order and leaves a
 * stray rule at the start of every wrapped line; a per-item leading border
 * suppressed at each row start does not.
 */
export interface MetricStripProps
  extends React.HTMLAttributes<HTMLDListElement> {
  children: React.ReactNode;
}

const MetricStrip = React.forwardRef<HTMLDListElement, MetricStripProps>(
  ({ className, children, ...props }, ref) => (
    <dl
      ref={ref}
      className={cn(
        "grid grid-cols-2 rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-card)] sm:grid-cols-4",
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
  /** Raises the value's tone and shows a pill beside the label. A metric is
   *  `attention` only when a person has to DO something — not merely when a
   *  number is zero. */
  attention?: { tone: StatusTone; label: string };
}

/**
 * One reading inside a `MetricStrip`.
 *
 * `<dt>` carries the label and `<dd>` the value, so the pair is announced as a
 * described term rather than as two loose strings — the semantic that makes a
 * figure legible without the visual grouping.
 *
 * The value is `tabular-nums`: these sit in a row and change on a timer, and
 * proportional digits make the column jitter every time a 1 becomes an 8.
 */
const Metric = React.forwardRef<HTMLDivElement, MetricProps>(
  ({ className, label, value, hint, attention, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Leading hairline, suppressed at the start of each wrapped row.
        "border-border border-l p-4 first:border-l-0 sm:p-5 [&:nth-child(odd)]:border-l-0 sm:[&:nth-child(odd)]:border-l",
        "sm:first:border-l-0",
        className,
      )}
      {...props}
    >
      <dt className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="truncate">{label}</span>
        {attention && (
          <StatusPill tone={attention.tone}>{attention.label}</StatusPill>
        )}
      </dt>
      {/* `truncate`, and a step down until the column is wide enough for the
          longest figure this strip carries. A balance renders as "$248.55" on a
          funded account and as "$1,284,003.10" on a busy one, and at four
          columns the wide case has nowhere to go — it either overflows its cell
          or pushes the whole strip past the page. */}
      <dd
        className={cn(
          "mt-1 truncate font-semibold text-xl tabular-nums tracking-tight lg:text-2xl",
          attention?.tone === "danger" && "text-[var(--surface-danger-text)]",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </dd>
      {hint && (
        <dd className="mt-0.5 truncate text-[var(--text-dim)] text-xs">
          {hint}
        </dd>
      )}
    </div>
  ),
);
Metric.displayName = "Metric";

export { Metric, MetricStrip };
