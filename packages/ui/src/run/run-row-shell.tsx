import { useState, type ReactNode } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { formatDuration } from "../utils/format";

export type RunRowStatus = "running" | "success" | "error" | "idle";

/**
 * Trailing status indicator shared by every run row. Only `error` draws a
 * mark (a red dot). Success is silence, and a running row carries its state in
 * the title — a `TextShimmer` sweep — so neither renders anything here.
 */
export function RunRowStatusDot({ status }: { status: RunRowStatus }) {
  if (status !== "error") return null;
  return (
    <span
      data-run-row-status="error"
      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--surface-danger-text)]"
    />
  );
}

export interface RunRowShellProps {
  /** Semantic lead glyph (14px). At rest it is the row's only ornament; on
   *  hover and while open the expand chevron takes its slot. */
  icon: ReactNode;
  /** Row title. A string in the common case; a node when the title carries its
   *  own treatment — a running row passes `<TextShimmer>` here, which is the
   *  whole in-flight signal (the shell draws no spinner). */
  title: ReactNode;
  /** Secondary inline text (tool path/command, or a reasoning preview). */
  description?: string;
  /** Render the description in mono (tools) vs prose (reasoning). */
  descriptionMono?: boolean;
  status?: RunRowStatus;
  /** @deprecated The shell no longer ticks a live duration while running; the
   *  running state lives in the title (`TextShimmer`). Accepted and ignored so
   *  existing callers keep compiling. */
  startTime?: number;
  /** Static duration, revealed on hover once the row is no longer running. */
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

// Header geometry: 8px inset, 22px glyph slot, 8px gap. The collapsed error
// indents by their sum so it starts under the title, not under the glyph.
const HEADER_INSET = "px-2 py-1";
const ERROR_INDENT = "pl-[2.375rem]";

/**
 * Shared shell for the agent activity rows (reasoning + tool). A quiet
 * one-liner at rest — bare glyph, muted title and description, no fill, no
 * border — that becomes a bordered card only while open. The border is always
 * present (transparent at rest) so hover and expand never shift layout.
 * Both row kinds render through it so they read as one family.
 */
export function RunRowShell({
  icon,
  title,
  description,
  descriptionMono = false,
  status = "idle",
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
          data-run-row=""
          data-state={open ? "open" : "closed"}
          className={cn(
            "group min-w-0 flex-1 overflow-hidden border transition-colors",
            open
              ? "border-border bg-[var(--md3-surface-container)]"
              : "border-transparent bg-transparent",
            expandable && !open && "hover:bg-[var(--md3-surface-container)]",
            SHAPE_CLASS[groupPosition],
            className,
          )}
        >
          <Collapsible.Trigger asChild disabled={!expandable}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 text-left",
                HEADER_INSET,
                expandable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                aria-hidden
                className="flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center text-muted-foreground"
              >
                <span
                  data-run-row-glyph=""
                  className={cn(
                    "flex items-center justify-center",
                    expandable && "group-hover:hidden",
                    open && "hidden",
                  )}
                >
                  {icon}
                </span>
                {expandable ? (
                  <ChevronRight
                    data-run-row-chevron=""
                    className={cn(
                      "hidden h-3.5 w-3.5 transition-transform group-hover:block",
                      open && "block rotate-90",
                    )}
                  />
                ) : null}
              </span>

              <span
                className={cn(
                  "shrink-0 whitespace-nowrap text-sm font-normal text-muted-foreground transition-colors group-hover:text-foreground",
                  open && "text-foreground",
                )}
              >
                {title}
              </span>
              {description ? (
                <span
                  className={cn(
                    "hidden min-w-0 flex-1 truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground sm:inline",
                    descriptionMono && "font-mono",
                  )}
                >
                  {description}
                </span>
              ) : null}

              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                {!isRunning && durationMs != null ? (
                  <span
                    data-run-row-duration=""
                    className="font-mono text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {formatDuration(durationMs)}
                  </span>
                ) : null}
                <RunRowStatusDot status={status} />
              </span>
            </button>
          </Collapsible.Trigger>

          {collapsedError && !open ? (
            <div
              className={cn(
                "pb-1.5 pr-2 text-xs leading-snug text-[var(--surface-danger-text)]",
                ERROR_INDENT,
              )}
            >
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
