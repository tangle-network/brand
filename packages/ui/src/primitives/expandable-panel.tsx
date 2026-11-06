"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export interface ExpandablePanelProps {
  children?: React.ReactNode;
  /** Accessible name: the toggle reads "Expand <label>" and "Close full screen <label>". */
  label: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  actions?: React.ReactNode; // controls shown beside the toggle
}

// Expanded panels in the order they opened; Escape closes only the last one.
const openPanels: symbol[] = [];
let bodyOverflow = "";

/**
 * A panel that fills the viewport in place and returns on Escape. The subtree
 * never moves (no portal), so chart, canvas and conversation state and scroll
 * survive the switch. Radix popovers, menus and dialogs inside take Escape
 * first: they prevent its default, which this panel respects.
 */
function ExpandablePanel({
  children,
  label,
  expanded: expandedProp,
  onExpandedChange,
  className,
  actions,
}: ExpandablePanelProps) {
  const [expandedState, setExpandedState] = React.useState(false);
  const expanded = expandedProp ?? expandedState;
  const toggleRef = React.useRef<HTMLButtonElement>(null);
  const setExpanded = (next: boolean) => {
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };
  // A ref, so a new onExpandedChange never re-registers and reorders the open stack.
  const setExpandedRef = React.useRef(setExpanded);
  setExpandedRef.current = setExpanded;

  React.useEffect(() => {
    if (!expanded) return;
    const id = Symbol(label);
    if (openPanels.length === 0) bodyOverflow = document.body.style.overflow;
    openPanels.push(id);
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || openPanels[openPanels.length - 1] !== id) return;
      event.preventDefault();
      setExpandedRef.current(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openPanels.splice(openPanels.indexOf(id), 1);
      if (openPanels.length === 0) document.body.style.overflow = bodyOverflow;
    };
  }, [expanded, label]);

  return (
    <div
      data-expandable-panel=""
      data-expanded={expanded ? "" : undefined}
      className={cn(
        "group/expandable relative flex min-h-0 flex-col",
        className, // before the expanded classes, so a caller's size cannot shrink it
        expanded && "fixed inset-0 z-50 m-0 h-auto max-h-none w-auto max-w-none rounded-none bg-background",
      )}
    >
      {children}
      <div
        className={cn(
          "absolute right-2 top-2 z-10 flex items-center gap-1 transition-opacity",
          expanded
            ? "opacity-100"
            : "opacity-0 group-hover/expandable:opacity-100 group-focus-within/expandable:opacity-100 pointer-coarse:opacity-100",
        )}
      >
        {actions}
        <Button
          ref={toggleRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`${expanded ? "Close full screen" : "Expand"} ${label}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

export { ExpandablePanel };
