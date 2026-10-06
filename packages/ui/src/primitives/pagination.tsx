import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";

/**
 * Page controls for a paged list or table: previous, the page numbers around
 * the current one with the first and last always reachable, and next.
 *
 * Pages are zero-based in the API and one-based on screen. With one page or
 * none there is nothing to choose, so it renders nothing.
 */
export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange" | "children"> {
  /** The current page, zero-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current one before an ellipsis. */
  siblings?: number;
}

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

export function Pagination({
  page,
  pageCount,
  onPageChange,
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
    if (target !== current) onPageChange(target);
  };

  return (
    <nav aria-label={ariaLabel} className={cn("flex items-center", className)} {...rest}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => go(current - 1)}
            className={cn(pageButton, "gap-1 pl-1.5")}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </button>
        </li>
        {pageSlots(current, pageCount, siblings).map((slot) =>
          typeof slot === "number" ? (
            <li key={slot}>
              <button
                type="button"
                aria-label={`Page ${slot + 1}`}
                aria-current={slot === current ? "page" : undefined}
                onClick={() => go(slot)}
                className={cn(
                  pageButton,
                  slot === current &&
                    "border-border bg-card font-semibold text-foreground hover:bg-card",
                )}
              >
                {slot + 1}
              </button>
            </li>
          ) : (
            <li key={slot} aria-hidden="true" className="flex min-w-8 justify-center text-sm text-muted-foreground">
              …
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={current === last}
            onClick={() => go(current + 1)}
            className={cn(pageButton, "gap-1 pr-1.5")}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
