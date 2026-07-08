import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/utils";

export interface ExpandableContentProps {
  children: ReactNode;
  /** Height (px) the content is clamped to while collapsed. */
  collapsedMaxPx?: number;
  /**
   * Gradient from-color for the bottom fade, so it blends with the surface
   * behind the content (e.g. `from-muted`, `from-card`, `from-[var(--surface-danger-bg)]`).
   */
  fadeClassName?: string;
  className?: string;
}

/**
 * Clamps tall content to a fixed height with a bottom fade and a
 * "Show more / Show less" toggle. Content shorter than the cap renders
 * as-is with no toggle.
 */
export function ExpandableContent({
  children,
  collapsedMaxPx = 180,
  fadeClassName = "from-muted",
  className,
}: ExpandableContentProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () =>
      setOverflowing(el.scrollHeight > collapsedMaxPx + 4);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedMaxPx]);

  const clamped = overflowing && !expanded;

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="relative overflow-hidden"
        style={clamped ? { maxHeight: collapsedMaxPx } : undefined}
      >
        {children}
        {clamped ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t to-transparent",
              fadeClassName,
            )}
          />
        ) : null}
      </div>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
