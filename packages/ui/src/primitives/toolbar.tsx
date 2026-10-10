import * as React from "react";
import { cn } from "../lib/utils";

/**
 * The control row above a table or list: search, filters, then the view switch.
 *
 * It exists because the alternative keeps producing the same two failures. A
 * bare flex row gives every control its natural width, so a search field sits
 * at 1120px on one line and three selects stack full-width beneath it — three
 * enormous empty bars where a compact bar belongs. And each control brought its
 * own visual language, so one row carried a native `<select>`, a custom input
 * and a segmented control side by side.
 *
 * So on one `lg` line the filters keep their content width while it fits,
 * search takes what is left between a 16rem floor and `max-w-sm`, and `actions`
 * stays at its content width. The row is the one place those controls are
 * composed, which is what keeps them looking like one set.
 *
 * Both earlier layouts failed one side. Filters at content width with no floor
 * starved search: a 537px filter row in an 832px toolbar left it 89px. Splitting
 * the row evenly clipped filters that would have fitted: at 1440px the Assets
 * bar cut its third field at the scroll edge while search sat at 384px. With the
 * floor, filters shrink and scroll only once search is down to 16rem.
 *
 * Below `lg` the row becomes a column and the filters wrap onto as many lines
 * as they need. Scrolling them as one line hid every filter past the first
 * behind the screen edge on a phone: at 390px the second select started at
 * 403px and a third at 652px, with nothing to say more were there. From `lg`
 * up they sit on one line as above.
 */
/**
 * Slots only — `children` is omitted deliberately. A free child would render as
 * a bare flex item with none of the `min-w-0` / `shrink-0` guards the named
 * slots carry, so it would size itself off its content and push the row into
 * the overflow this layout exists to prevent.
 */
export interface ToolbarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The one control that expands to fill the row. */
  search?: React.ReactNode;
  /** Filters, in reading order. Wrapped below `lg`; one scrollable line from `lg` up. */
  filters?: React.ReactNode;
  /** View switches and exports, pinned to the end. */
  actions?: React.ReactNode;
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, search, filters, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Filters sit on the page canvas, where the recessed field well barely
        // differs from the page. Raise every field inside onto the card surface.
        "mb-4 flex flex-col gap-3 lg:flex-row lg:items-center [--field-surface:hsl(var(--card))]",
        className,
      )}
      {...props}
    >
      {search && <div className="min-w-0 lg:min-w-64 lg:max-w-sm lg:flex-1">{search}</div>}
      {filters && (
        // `py-1` leaves room for a focus ring above and below; on the single
        // `lg` line the scroll container clips it horizontally, which is the
        // trade a one-line filter row makes. No negative margin — pulling the
        // row wider than its parent is what made every page report 4px of
        // horizontal overflow.
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 py-1 lg:flex-initial lg:flex-nowrap lg:gap-2 lg:overflow-x-auto">
          {filters}
        </div>
      )}
      {actions && (
        <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
          {actions}
        </div>
      )}
    </div>
  ),
);
Toolbar.displayName = "Toolbar";

/**
 * A labelled filter control. The label is visible, not a placeholder: a select
 * whose current value IS its label ("All products") tells the reader what is
 * selected but never what the control governs, so a row of three reads as three
 * unrelated words.
 */
export interface FilterFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
}

const FilterField = React.forwardRef<HTMLDivElement, FilterFieldProps>(
  ({ className, label, htmlFor, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    >
      {/* 14px, the floor for any text a product shows; a 12px label beside a 14px control reads as a footnote. */}
      <label
        htmlFor={htmlFor}
        className="whitespace-nowrap text-muted-foreground text-sm"
      >
        {label}
      </label>
      {children}
    </div>
  ),
);
FilterField.displayName = "FilterField";

export { FilterField, Toolbar };
