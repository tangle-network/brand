import { useState, type ReactNode } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Loader2, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { formatDuration } from "../utils/format";
import { LiveDuration } from "./run-item-primitives";

export type RunRowStatus = "running" | "success" | "error" | "idle";

/**
 * Trailing status indicator shared by every run row: a spinner while running,
 * a green/red dot on terminal states, nothing when idle. Status is shown here
 * — it never replaces the row's semantic lead icon.
 */
export function RunRowStatusDot({ status }: { status: RunRowStatus }) {
  if (status === "running") {
    return <Loader2 className="h-3 w-3 shrink-0 animate-spin text-[var(--accent-text)]" />;
  }
  if (status === "success") {
    return (
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--surface-success-text)]" />
    );
  }
  if (status === "error") {
    return (
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--surface-danger-text)]" />
    );
  }
  return null;
}

export interface RunRowShellProps {
  /** Semantic lead glyph — always visible; never replaced by status. */
  icon: ReactNode;
  title: string;
  /** Secondary inline text (tool path/command, or a reasoning preview). */
  description?: string;
  /** Render the description in mono (tools) vs prose (reasoning). */
  descriptionMono?: boolean;
  status?: RunRowStatus;
  /** Live-ticks a duration while running. */
  startTime?: number;
  /** Static duration shown once the row is no longer running. */
  durationMs?: number;
  /** Radius shaping when rows are stacked into a group. */
  groupPosition?: "single" | "first" | "middle" | "last";
  /** Message shown below the header while collapsed (tool errors). */
  collapsedError?: string;
  actions?: ReactNode;
  /** Controlled open state. Omit for internal (uncontrolled) state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  /** Expanded body. When absent the row is not expandable. */
  children?: ReactNode;
}

const SHAPE_CLASS: Record<
  NonNullable<RunRowShellProps["groupPosition"]>,
  string
> = {
  single: "rounded-[var(--radius-lg)]",
  first: "rounded-t-[var(--radius-lg)] rounded-b-[var(--radius-sm)]",
  middle: "rounded-[var(--radius-sm)]",
  last: "rounded-t-[var(--radius-sm)] rounded-b-[var(--radius-lg)]",
};

/**
 * Shared shell for the agent activity rows (reasoning + tool). Owns the
 * bordered container, the lead icon badge, title/description, the trailing
 * meta cluster (duration + status + chevron) and the collapsible body, so
 * both row kinds read as one family instead of two bespoke layouts.
 */
export function RunRowShell({
  icon,
  title,
  description,
  descriptionMono = false,
  status = "idle",
  startTime,
  durationMs,
  groupPosition = "single",
  collapsedError,
  actions,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  className,
  contentClassName,
  children,
}: RunRowShellProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const setOpen = (next: boolean) => {
    if (!isControlled) setOpenState(next);
    onOpenChange?.(next);
  };

  const isRunning = status === "running";
  const expandable = children != null;

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden border transition-colors",
            "border-[var(--border-subtle)] bg-[var(--md3-surface-container)]",
            expandable && "hover:border-border",
            open && "border-border",
            SHAPE_CLASS[groupPosition],
            className,
          )}
        >
          <Collapsible.Trigger asChild disabled={!expandable}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left",
                expandable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-muted text-muted-foreground">
                {icon}
              </span>

              <span className="shrink-0 whitespace-nowrap text-xs font-medium text-foreground">
                {title}
              </span>
              {description ? (
                <span
                  className={cn(
                    "hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:inline",
                    descriptionMono && "font-mono",
                  )}
                >
                  {description}
                </span>
              ) : null}

              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                {isRunning && startTime != null ? (
                  <LiveDuration startTime={startTime} />
                ) : durationMs != null ? (
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                    {formatDuration(durationMs)}
                  </span>
                ) : null}
                <RunRowStatusDot status={status} />
                {expandable ? (
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-90",
                    )}
                  />
                ) : null}
              </div>
            </button>
          </Collapsible.Trigger>

          {collapsedError && !open ? (
            <div className="border-t border-border px-3 py-2 text-xs text-[var(--surface-danger-text)]">
              {collapsedError}
            </div>
          ) : null}

          {expandable ? (
            <Collapsible.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
              <div className={cn("border-t border-border", contentClassName)}>
                {children}
              </div>
            </Collapsible.Content>
          ) : null}
        </div>

        {actions ? (
          <div
            className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-1"
            onClick={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </Collapsible.Root>
  );
}
