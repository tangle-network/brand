import { type ReactNode } from "react";
import { cn } from "../lib/utils";

export interface ArtifactPaneProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  headerActions?: ReactNode;
  tabs?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  emptyState?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Extra classes for the header band (e.g. to align its surface with the host chrome). */
  headerClassName?: string;
  /**
   * Suppress the eyebrow/title/subtitle/meta block. Use when the host already
   * shows the artifact's identity elsewhere (e.g. a surrounding path row), so the
   * pane keeps only its tabs, toolbar, and header actions. The whole header row
   * collapses when nothing else would render in it.
   */
  hideTitleBlock?: boolean;
}

/**
 * ArtifactPane — shared frame for files, previews, documents, inspectors, and
 * other artifact-like surfaces inside sandbox applications.
 */
export function ArtifactPane({
  eyebrow,
  title,
  subtitle,
  meta,
  headerActions,
  tabs,
  toolbar,
  footer,
  emptyState,
  children,
  className,
  contentClassName,
  headerClassName,
  hideTitleBlock = false,
}: ArtifactPaneProps) {
  const hasContent = children !== undefined && children !== null;
  // With the title block hidden, still render the top row if there are header
  // actions to place; the block itself just collapses to empty.
  const showTitleRow = !hideTitleBlock || Boolean(headerActions);
  const hasHeader = showTitleRow || Boolean(tabs) || Boolean(toolbar);
  // The toolbar's top divider only reads as a separator when something sits
  // above it; as the header's first row it would double the host's own border.
  const toolbarNeedsDivider = showTitleRow || Boolean(tabs);

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      {hasHeader && (
        <header className={cn("border-b border-border bg-muted/10", headerClassName)}>
          {showTitleRow && (
            <div className="flex items-start justify-between gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                {!hideTitleBlock && (
                  <>
                    {eyebrow && (
                      <div className="mb-1 inline-flex max-w-full items-center px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {eyebrow}
                      </div>
                    )}
                    <div className="min-w-0 text-[13px] font-medium text-foreground">
                      {title}
                    </div>
                    {(subtitle || meta) && (
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-muted-foreground">
                        {subtitle && <span className="truncate">{subtitle}</span>}
                        {meta && <span className="flex items-center gap-2">{meta}</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
              {headerActions && (
                <div className="flex shrink-0 items-center gap-1.5">{headerActions}</div>
              )}
            </div>
          )}
          {tabs}
          {toolbar && (
            <div className={cn("px-3 py-2", toolbarNeedsDivider && "border-t border-border")}>
              {toolbar}
            </div>
          )}
        </header>
      )}

      <div className={cn("min-h-0 flex-1 overflow-auto", contentClassName)}>
        {hasContent ? (
          children
        ) : emptyState ? (
          <div className="flex h-full items-center justify-center p-6">{emptyState}</div>
        ) : null}
      </div>

      {footer && (
        <footer className="shrink-0 border-t border-border bg-card px-3 py-2">
          {footer}
        </footer>
      )}
    </section>
  );
}
