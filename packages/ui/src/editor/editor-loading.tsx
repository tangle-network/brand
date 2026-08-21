"use client";

import { cn } from "../lib/utils";

/**
 * Stands in for an editor while its optional peers load. The editors reach
 * tiptap through a dynamic import, so an editor's first frame waits for that
 * chunk. The live region announces the wait, which a screen reader has no
 * other way to notice. Callers put their own minimum height first, so a
 * caller-supplied className still wins.
 */
export function EditorLoadingPlaceholder({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-full items-center justify-center rounded-lg border border-border border-dashed bg-muted text-muted-foreground text-sm",
        className,
      )}
    >
      Loading editor…
    </div>
  );
}
