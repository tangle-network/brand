import { type HTMLAttributes, type ReactNode } from "react";
import { Check, ChevronRight, Circle, FileMinus, FilePen, FilePlus } from "lucide-react";
import { cn } from "../lib/utils";

export interface ApprovalDiffFile {
  path: string;
  change?: "added" | "modified" | "deleted";
  /** Unknown counts render as a dash rather than a guessed zero. */
  additions?: number;
  deletions?: number;
}

export interface ApprovalPlanStep {
  label: ReactNode;
  state: "done" | "current" | "upcoming";
}

export interface ApprovalCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** What the action does, in plain words. */
  title: ReactNode;
  /** Where it acts, such as "GitHub · owner/repo". */
  context?: ReactNode;
  /** This action's place in a declared plan. */
  step?: { index: number; total: number };
  /** The plan's steps, when the action belongs to one. */
  plan?: readonly ApprovalPlanStep[];
  /** Files the action writes, with line counts when known. */
  diff?: readonly ApprovalDiffFile[];
  /** Shown while line counts are being read. */
  diffNote?: ReactNode;
  /** The raw request, behind a Details toggle. */
  details?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}

const CHANGE_ICON = { added: FilePlus, modified: FilePen, deleted: FileMinus } as const;

function count(value: number | undefined, sign: "+" | "−"): string {
  return value === undefined ? `${sign}–` : `${sign}${value}`;
}

/** Files and +/− line counts for a write, with totals when every count is known. */
export function ApprovalDiffSummary({ files, note }: { files: readonly ApprovalDiffFile[]; note?: ReactNode }) {
  const known = files.every((file) => file.additions !== undefined && file.deletions !== undefined);
  const additions = files.reduce((sum, file) => sum + (file.additions ?? 0), 0);
  const deletions = files.reduce((sum, file) => sum + (file.deletions ?? 0), 0);
  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 text-sm">
        <span className="font-medium text-foreground">{files.length === 1 ? "1 file" : `${files.length} files`}</span>
        {known
          ? (
              <span className="tabular-nums">
                <span className="text-[var(--surface-success-text)]">+{additions}</span>{" "}
                <span className="text-[var(--surface-danger-text)]">−{deletions}</span>
              </span>
            )
          : note && <span className="text-muted-foreground">{note}</span>}
      </div>
      <ul className="divide-y divide-border/70">
        {files.map((file) => {
          const Icon = CHANGE_ICON[file.change ?? "modified"];
          return (
            <li key={file.path} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate font-mono text-foreground" title={file.path}>{file.path}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="text-[var(--surface-success-text)]">{count(file.additions, "+")}</span>{" "}
                <span className="text-[var(--surface-danger-text)]">{count(file.deletions, "−")}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlanMarker({ state }: { state: ApprovalPlanStep["state"] }) {
  if (state === "done") return <Check aria-hidden className="size-4 shrink-0 text-[var(--surface-success-text)]" />;
  if (state === "current") return <ChevronRight aria-hidden className="size-4 shrink-0 text-foreground" />;
  return <Circle aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />;
}

/**
 * A request for a person to approve one action: what it does in plain words,
 * where, its step in a plan, the files it writes, and the raw request behind
 * a Details toggle. The caller owns the decision and supplies the actions.
 */
export function ApprovalCard({
  title, context, step, plan, diff, diffNote, details, status, actions, className, ...props
}: ApprovalCardProps) {
  return (
    <section
      role="group"
      aria-label="Approval request"
      {...props}
      className={cn("space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm", className)}
    >
      <div className="space-y-1">
        {(step || context) && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {step && (
              <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                Step {step.index} of {step.total}
              </span>
            )}
            {context && <span className="min-w-0 truncate">{context}</span>}
          </p>
        )}
        <h3 className="text-base font-semibold leading-6 text-foreground">{title}</h3>
      </div>
      {plan && plan.length > 0 && (
        <ol className="space-y-1.5" aria-label="Plan">
          {plan.map((item, index) => (
            <li
              key={index}
              aria-current={item.state === "current" ? "step" : undefined}
              className={cn(
                "flex items-start gap-2 text-sm leading-6",
                item.state === "current" ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="mt-1"><PlanMarker state={item.state} /></span>
              <span className="min-w-0">{item.label}</span>
            </li>
          ))}
        </ol>
      )}
      {diff && diff.length > 0 && <ApprovalDiffSummary files={diff} note={diffNote} />}
      {details !== undefined && (
        <details className="group text-sm">
          <summary className="cursor-pointer select-none font-medium text-muted-foreground hover:text-foreground">
            Details
          </summary>
          <div className="mt-2">{details}</div>
        </details>
      )}
      {status}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  );
}
