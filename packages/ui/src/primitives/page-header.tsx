import * as React from "react";
import { cn } from "../lib/utils";
import { Heading } from "./heading";

/**
 * A page masthead with separate title, prose, actions and qualifying metadata.
 * Brand's existing props and header ref are preserved. Sandbox's existing
 * action/eyebrow/titleAs inputs map into the same renderer, not a second header.
 */
export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  presentation?: "operational" | "expressive";
  description?: React.ReactNode;
  /** Canonical action slot. If supplied (even null), takes precedence over action. */
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  titleId?: string;
  /** Existing nested-surface treatment: h2 and section typography. */
  level?: 1 | 2;
  /** Existing Sandbox action slot; used only when actions is undefined. */
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Existing Sandbox semantic override; takes precedence over level's tag only. */
  titleAs?: React.ElementType;
}

// A numeric zero is useful metadata, not an absent slot.
const hasContent = (node: React.ReactNode) => Boolean(node) || node === 0;

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      className,
      presentation,
      title,
      description,
      actions,
      action,
      eyebrow,
      meta,
      titleId,
      titleAs,
      level = 1,
      ...props
    },
    ref,
  ) => {
    const resolvedActions = actions === undefined ? action : actions;
    return (
      <header ref={ref} className={cn(presentation === "expressive" ? "tangle-intro" : presentation === "operational" ? "tangle-page-header" : "mb-6 min-w-0", className)} {...props}>
        <div className={presentation ? "tangle-page-header-main" : "flex min-w-0 flex-wrap items-start justify-between gap-x-6 gap-y-3"}>
          <div className="min-w-0 flex-[1_1_16rem]">
            {hasContent(eyebrow) && (
              <Heading variant="eyebrow" className="mb-1.5">{eyebrow}</Heading>
            )}
            <Heading
              id={titleId}
              variant={presentation === "expressive" ? "display" : level === 1 ? "page" : "section"}
              presentation={presentation}
              as={titleAs ?? (level === 1 ? "h1" : "h2")}
              className="text-balance"
            >
              {title}
            </Heading>
            {hasContent(description) && (
              <p className={presentation === "expressive" ? "tangle-intro-description" : presentation ? "tangle-page-description" : "mt-1 max-w-prose text-muted-foreground text-sm [overflow-wrap:anywhere]"}>
                {description}
              </p>
            )}
          </div>
          {hasContent(resolvedActions) && (
            <div className={presentation === "expressive" ? "tangle-intro-actions" : "flex min-w-0 max-w-full flex-wrap items-center gap-2 [overflow-wrap:anywhere] [&>*]:min-w-0 [&>*]:max-w-full"}>
              {resolvedActions}
            </div>
          )}
        </div>
        {hasContent(meta) && (
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[var(--text-dim)] text-xs [overflow-wrap:anywhere]">
            {meta}
          </div>
        )}
      </header>
    );
  },
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
