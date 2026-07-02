import { type ReactNode } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export interface AssistantRunShellProps {
  /** Header label, e.g. the agent name or "Tools". */
  label: string;
  /** Terse stat line beside the label, e.g. "3 tools, 2s thinking". */
  summary?: string;
  /** One-line preview shown next to the label AND below the header when collapsed. */
  collapsedPreview?: string;
  /** Small trailing glyphs before the status pill (e.g. category badges). */
  badges?: ReactNode;
  /** Drives the status pill and header spinner. */
  isStreaming?: boolean;
  collapsed: boolean;
  onToggle: () => void;
  /** Actions rendered outside the collapse trigger, right of the header. */
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The collapsible "assistant run" container shared by `RunGroup` (session-model
 * driven) and `AgentTimeline` (declarative item list). Owns the header
 * (label · summary · badges · status pill · chevron), the collapsed preview, and
 * the Radix collapse — so both transcripts fold agent activity the same way and
 * there is one implementation of a run, not two. It renders only chrome; callers
 * pass the run body (tool rows, reasoning, text) as `children`.
 */
export function AssistantRunShell({
  label,
  summary,
  collapsedPreview,
  badges,
  isStreaming,
  collapsed,
  onToggle,
  headerActions,
  children,
  className,
}: AssistantRunShellProps) {
  return (
    <Collapsible.Root open={!collapsed} onOpenChange={() => onToggle()}>
      <div
        className={cn(
          "rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-none",
          className,
        )}
      >
        <div className="flex items-start gap-3 px-3 py-2.5">
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="w-full rounded-[20px] bg-transparent px-0 py-0 text-left transition-colors hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{label}</span>

                {summary ? (
                  <span className="text-[11px] text-muted-foreground">{summary}</span>
                ) : null}
                {collapsed && collapsedPreview ? (
                  <span className="min-w-0 truncate text-[11px] text-foreground/70">
                    {collapsedPreview}
                  </span>
                ) : null}

                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                  {badges}

                  {isStreaming ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-accent)] bg-[var(--accent-surface-soft)] px-2 py-px text-[10px] font-semibold uppercase text-[var(--accent-text)]">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Running
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-px text-[10px] font-semibold uppercase text-muted-foreground">
                      <Sparkles className="h-2.5 w-2.5" />
                      Done
                    </span>
                  )}

                  {collapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>
          </Collapsible.Trigger>

          {headerActions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-1">
              {headerActions}
            </div>
          ) : null}
        </div>

        {collapsed && collapsedPreview ? (
          <div className="line-clamp-2 px-4 pb-4 text-sm leading-6 text-muted-foreground">
            {collapsedPreview}
          </div>
        ) : null}

        <Collapsible.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
          <div className="border-t border-[var(--border-subtle)] px-4 pb-4 pt-3">{children}</div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}
