import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface PageShellProps {
  children?: ReactNode;
  /** Optional reading layout. Content, routing and navigation interaction stay caller-owned. */
  navigation?: ReactNode;
  article?: ReactNode;
  outline?: ReactNode;
  navigationLabel?: string;
  outlineLabel?: string;
  className?: string;
}

/**
 * Ported from sandbox-ui/src/primitives/page-shell.tsx. An optional bounded
 * width, gutter and vertical rhythm, not an application shell or a card grid.
 * The caller owns landmarks, routing, auth, navigation and data state. Use
 * className to override the bound/gutters, or omit it for a workbench layout.
 */
export function PageShell({ children, className, navigation, article, outline, navigationLabel = "Sections", outlineLabel = "On this page" }: PageShellProps) {
  if (navigation || article || outline) return <div className={cn("tangle-reading-shell",className)}>
    {navigation && <nav aria-label={navigationLabel} className="tangle-reading-nav">{navigation}</nav>}
    <article className="tangle-reading-article">{article ?? children}</article>
    {outline && <aside aria-label={outlineLabel} className="tangle-reading-outline">{outline}</aside>}
  </div>;
  return (
    <div
      className={cn(
        "mx-auto min-w-0 w-full max-w-6xl space-y-8 px-6 py-8 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
