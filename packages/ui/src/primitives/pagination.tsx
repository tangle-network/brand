import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

interface PaginationBaseProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange" | "children"> {
  /** The current page, zero-based. */
  page: number;
  pageCount: number;
  /** Pages shown on each side of the current one before an ellipsis. */
  siblings?: number;
}

export interface PaginationButtonProps extends PaginationBaseProps {
  onPageChange: (page: number) => void;
  hrefFor?: never;
  linkComponent?: never;
}

export interface PaginationLinkProps extends PaginationBaseProps {
  /** The URL of a page, given the zero-based page. */
  hrefFor: (page: number) => string;
  /** Renders each enabled control. Receives `href`; defaults to `"a"`. */
  linkComponent?: React.ElementType;
  /** Called with the target page when a link to another page is clicked. */
  onPageChange?: (page: number) => void;
}

/**
 * Page controls for a paged list or table: previous, the page numbers around
 * the current one with the first and last always reachable, and next.
 *
 * Pages are zero-based in the API and one-based on screen. With one page or
 * none there is nothing to choose, so it renders nothing.
 *
 * Give `onPageChange` to render buttons, or `hrefFor` to render links for a
 * list paged by URL. In link mode each enabled control is rendered by
 * `linkComponent` (an `<a>` by default) with `href`, `className`,
 * `aria-label`, `aria-current` and children; a disabled previous or next is a
 * `<span aria-disabled="true">` with no `href`. A router whose link takes `to`
 * instead of `href` needs a small adapter:
 *
 * ```tsx
 * import { Link } from "react-router";
 *
 * const RouterLink = ({ href, ...props }: React.ComponentProps<"a">) => (
 *   <Link to={href ?? ""} {...props} />
 * );
 *
 * <Pagination
 *   page={page}
 *   pageCount={pageCount}
 *   hrefFor={(p) => `?page=${p + 1}`}
 *   linkComponent={RouterLink}
 * />
 * ```
 */
export type PaginationProps = PaginationButtonProps | PaginationLinkProps;

type PageSlot = number | "gap-start" | "gap-end";

/**
 * The visible slots for `page` of `pageCount`. The number of slots stays the
 * same as the current page moves, so the controls do not shift under the
 * pointer while a person clicks through.
 */
export function pageSlots(page: number, pageCount: number, siblings = 1): PageSlot[] {
  const last = pageCount - 1;
  if (pageCount <= siblings * 2 + 5) return Array.from({ length: pageCount }, (_, i) => i);

  const current = Math.min(Math.max(page, 0), last);
  const start = Math.max(Math.min(current - siblings, last - siblings * 2 - 2), 2);
  const end = Math.min(Math.max(current + siblings, siblings * 2 + 2), last - 2);

  const slots: PageSlot[] = [0, start > 2 ? "gap-start" : 1];
  for (let i = start; i <= end; i++) slots.push(i);
  slots.push(end < last - 2 ? "gap-end" : last - 1, last);
  return slots;
}

const pageButton = cn(buttonVariants({ variant: "ghost", size: "sm" }), "min-w-8 px-2 tabular-nums");

interface ControlProps {
  target: number;
  label: string;
  className: string;
  disabled?: boolean;
  current?: boolean;
  children: React.ReactNode;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  hrefFor,
  linkComponent: LinkComponent = "a",
  siblings = 1,
  className,
  "aria-label": ariaLabel = "Pagination",
  ...rest
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const last = pageCount - 1;
  const current = Math.min(Math.max(page, 0), last);
  const go = (next: number) => {
    const target = Math.min(Math.max(next, 0), last);
    if (target !== current) onPageChange?.(target);
  };

  const control = ({ target, label, className: controlClass, disabled, current: isCurrent, children }: ControlProps) => {
    const ariaCurrent = isCurrent ? ("page" as const) : undefined;
    if (!hrefFor) {
      return (
        <button
          type="button"
          aria-label={label}
          aria-current={ariaCurrent}
          disabled={disabled}
          onClick={() => go(target)}
          className={controlClass}
        >
          {children}
        </button>
      );
    }
    if (disabled) {
      return (
        <span role="link" aria-label={label} aria-disabled="true" className={cn(controlClass, "pointer-events-none")}>
          {children}
        </span>
      );
    }
    return (
      <LinkComponent
        href={hrefFor(target)}
        aria-label={label}
        aria-current={ariaCurrent}
        onClick={onPageChange ? () => go(target) : undefined}
        className={controlClass}
      >
        {children}
      </LinkComponent>
    );
  };

  return (
    <nav aria-label={ariaLabel} className={cn("flex items-center", className)} {...rest}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          {control({
            target: current - 1,
            label: "Previous page",
            disabled: current === 0,
            className: cn(pageButton, "gap-1 pl-1.5"),
            children: (
              <>
                <ChevronLeft aria-hidden="true" />
                <span className="hidden sm:inline">Previous</span>
              </>
            ),
          })}
        </li>
        {pageSlots(current, pageCount, siblings).map((slot) =>
          typeof slot === "number" ? (
            <li key={slot}>
              {control({
                target: slot,
                label: `Page ${slot + 1}`,
                current: slot === current,
                className: cn(
                  pageButton,
                  slot === current &&
                    "border-border bg-card font-semibold text-foreground hover:bg-card",
                ),
                children: slot + 1,
              })}
            </li>
          ) : (
            <li key={slot} aria-hidden="true" className="flex min-w-8 justify-center text-sm text-muted-foreground">
              …
            </li>
          ),
        )}
        <li>
          {control({
            target: current + 1,
            label: "Next page",
            disabled: current === last,
            className: cn(pageButton, "gap-1 pr-1.5"),
            children: (
              <>
                <span className="hidden sm:inline">Next</span>
                <ChevronRight aria-hidden="true" />
              </>
            ),
          })}
        </li>
      </ul>
    </nav>
  );
}
