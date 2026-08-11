import * as React from "react";
import { cn } from "../lib/utils";

/**
 * The one masthead every console page opens with.
 *
 * A page identifies itself in three separate registers, and each gets its own
 * slot here so they cannot compete for the same one:
 *
 *   - `title` — what the page IS. The `<h1>`, and the only `<h1>`.
 *   - `description` — one line on what it is for. Prose belongs here, never in
 *     the title slot: a paragraph rendered where a heading goes reads as body
 *     copy to a sighted reader and as nothing at all to a screen reader, which
 *     is how a page ends up with no accessible name.
 *   - `actions` — what the reader can DO from here, right-aligned and wrapping
 *     under the title on a narrow viewport rather than squeezing it.
 *
 * `meta` is the fourth register and the one most often missing: the small facts
 * that qualify everything below (a count, a scope, a window). They sit on their
 * own line under the title so a reader can tell the difference between "this
 * page has nothing in it" and "this filter matches nothing".
 *
 * `titleId` is exposed so a page can point `aria-labelledby` at the heading
 * from a region further down without minting a second copy of the string.
 */
export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  titleId?: string;
  /** Renders the title one step down for a nested/tab surface. */
  level?: 1 | 2;
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      className,
      title,
      description,
      actions,
      meta,
      titleId,
      level = 1,
      ...props
    },
    ref,
  ) => {
    const Heading = level === 1 ? "h1" : "h2";
    return (
      <header ref={ref} className={cn("mb-6", className)} {...props}>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <Heading
              id={titleId}
              className={cn(
                "text-balance font-semibold tracking-tight",
                level === 1 ? "text-2xl" : "text-lg",
              )}
            >
              {title}
            </Heading>
            {description && (
              <p className="mt-1 max-w-prose text-muted-foreground text-sm">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[var(--text-dim)] text-xs">
            {meta}
          </div>
        )}
      </header>
    );
  },
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
