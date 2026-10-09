import { useState, type ReactNode } from "react";
import { ChevronRight, CircleAlert, Loader2 } from "lucide-react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

export interface RunPhase {
  id: string;
  /** The step or phase the work belongs to. */
  title: ReactNode;
  /** One line on what happened, such as "Read 12 files · ran 3 commands". */
  summary?: ReactNode;
  status?: "running" | "done" | "error";
  /** The phase's individual steps, shown when expanded. */
  content: ReactNode;
}

function PhaseRow({ phase }: { phase: RunPhase }) {
  const [open, setOpen] = useState(false);
  const id = `run-phase-${phase.id}`;
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-start gap-2 rounded-md py-1 text-left text-sm transition-colors hover:text-foreground",
          focusRing,
        )}
      >
        <ChevronRight
          aria-hidden
          className={cn("mt-1 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <span className="min-w-0 flex-1 leading-6">
          <span className="font-medium text-foreground">{phase.title}</span>
          {phase.summary && <span className="text-muted-foreground"> · {phase.summary}</span>}
        </span>
        {phase.status === "running" && <Loader2 aria-label="Running" className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" />}
        {phase.status === "error" && <CircleAlert aria-label="Had an error" className="mt-1 size-4 shrink-0 text-[var(--surface-danger-text)]" />}
      </button>
      {open && <div id={id} className="mb-2 ml-6 mt-1">{phase.content}</div>}
    </li>
  );
}

/** A turn's tool runs grouped by step, each collapsed to one summarizing line. */
export function RunPhaseList({ phases, className }: { phases: readonly RunPhase[]; className?: string }) {
  if (phases.length === 0) return null;
  return (
    <ul className={cn("space-y-0.5", className)} aria-label="Tool runs">
      {phases.map((phase) => <PhaseRow key={phase.id} phase={phase} />)}
    </ul>
  );
}
