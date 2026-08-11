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
 * So search and filters SHARE the free space and `actions` stays at its content
 * width, and the row is the one place those controls are composed, which is what
 * keeps them looking like one set.
 *
 * Sharing is deliberate, and the alternative is worse. Giving the filter row its
 * content width starves search: measured with a 537px filter row in an 832px
 * toolbar, the search field collapses to 89px. Letting both flex bounds the
 * filter row instead, so it scrolls within its half — 313px each in that same
 * case — and search stays usable however many filters a page adds. `max-w-sm`
 * then stops search claiming more than it can use when there are few filters.
 *
 * On a narrow viewport the row becomes a column and the filters scroll
 * horizontally as a group rather than wrapping into a tall stack that pushes
 * the table itself below the fold.
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
  /** Filters, in reading order. Kept on one scrollable line when space runs out. */
  filters?: React.ReactNode;
  /** View switches and exports, pinned to the end. */
  actions?: React.ReactNode;
}

const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, search, filters, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mb-4 flex flex-col gap-3 lg:flex-row lg:items-center",
        className,
      )}
      {...props}
    >
      {search && <div className="min-w-0 lg:max-w-sm lg:flex-1">{search}</div>}
      {filters && (
        // `py-1` leaves room for a focus ring above and below; horizontally the
        // scroll container clips it, which is the trade a single-line filter row
        // makes. No negative margin — pulling the row wider than its parent is
        // what made every page report 4px of horizontal overflow.
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto py-1 lg:flex-1">
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
      <label
        htmlFor={htmlFor}
        className="whitespace-nowrap text-muted-foreground text-xs"
      >
        {label}
      </label>
      {children}
    </div>
  ),
);
FilterField.displayName = "FilterField";

export { FilterField, Toolbar };
