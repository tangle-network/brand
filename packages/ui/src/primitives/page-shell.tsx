import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Ported from sandbox-ui/src/primitives/page-shell.tsx. An optional bounded
 * width, gutter and vertical rhythm, not an application shell or a card grid.
 * The caller owns landmarks, routing, auth, navigation and data state. Use
 * className to override the bound/gutters, or omit it for a workbench layout.
 */
export function PageShell({ children, className }: PageShellProps) {
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
