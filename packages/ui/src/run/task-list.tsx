import { type ReactNode } from "react";
import { StatusPill, type StatusTone } from "../primitives/status-pill";
import { cn } from "../lib/utils";

/** The states an agent's working checklist reports; unknown values read as to-do. */
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled" | "blocked" | "failed";

export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus | (string & {});
  priority?: string;
  description?: string;
}

export interface TaskListProps {
  items: readonly TaskListItem[];
  /** Header title; "Tasks" by default. */
  title?: ReactNode;
  /** Trailing header content, such as a run state. */
  meta?: ReactNode;
  className?: string;
}

const STATUS: Record<TaskStatus, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "To do" },
  in_progress: { tone: "running", label: "In progress" },
  completed: { tone: "success", label: "Done" },
  cancelled: { tone: "neutral", label: "Cancelled" },
  blocked: { tone: "warning", label: "Blocked" },
  failed: { tone: "danger", label: "Failed" },
};

const STATUS_ALIASES: Record<string, TaskStatus> = {
  todo: "pending", open: "pending", in_progress: "in_progress", "in-progress": "in_progress",
  active: "in_progress", running: "in_progress", done: "completed", complete: "completed",
  completed: "completed", success: "completed", cancelled: "cancelled", canceled: "cancelled",
  skipped: "cancelled", blocked: "blocked", failed: "failed", error: "failed",
};

export function taskStatus(status: string): TaskStatus {
  const key = status.trim().toLowerCase();
  return (STATUS as Record<string, unknown>)[key] ? key as TaskStatus : STATUS_ALIASES[key] ?? "pending";
}

/** Priority is worth a label only when the tasks disagree about it. */
export function showsTaskPriority(items: readonly TaskListItem[]): boolean {
  const priorities = new Set(items.map((item) => item.priority?.trim().toLowerCase()).filter(Boolean));
  return priorities.size > 1;
}

/** "2 of 3 done": cancelled tasks leave the count rather than counting as done. */
export function taskProgress(items: readonly TaskListItem[]): { done: number; total: number } {
  const counted = items.filter((item) => taskStatus(item.status) !== "cancelled");
  return { done: counted.filter((item) => taskStatus(item.status) === "completed").length, total: counted.length };
}

function capitalized(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * An agent's working checklist: a header with progress, each task's state as
 * a toned pill, and priority shown only when the tasks differ in it.
 */
export function TaskList({ items, title = "Tasks", meta, className }: TaskListProps) {
  const showPriority = showsTaskPriority(items);
  const { done, total } = taskProgress(items);
  return (
    <section
      aria-label={typeof title === "string" ? title : "Tasks"}
      className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", className)}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {total > 0 && <span className="text-sm text-muted-foreground">{done} of {total} done</span>}
        </div>
        {meta}
      </header>
      {total > 0 && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--surface-success-text)] transition-[width]"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}
      <ol className="divide-y divide-border/70">
        {items.map((item, index) => {
          const status = STATUS[taskStatus(item.status)];
          return (
            <li key={`${item.id}-${index}`} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-6 text-foreground",
                    taskStatus(item.status) === "cancelled" && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </p>
                {item.description && <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{item.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {showPriority && item.priority && (
                  <span className="text-sm text-muted-foreground">{capitalized(item.priority.trim())}</span>
                )}
                <StatusPill tone={status.tone} size="md">{status.label}</StatusPill>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
