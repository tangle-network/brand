import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleQuestionMark,
  CircleStop,
  CircleX,
  Hand,
  Hourglass,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { cn } from "../lib/utils";

/** The states an agent or a run reports. Every surface names them with `statusMeta`. */
export type RunStatus = "running" | "waiting" | "needs-you" | "done" | "failed" | "stopped" | "idle" | "unknown";

export interface StatusMeta {
  /** The one word for the state. A qualifier such as "Shipped" follows Done; it never replaces it. */
  label: string;
  /** The lucide glyph, drawn on the 16px grid at stroke 1.75 (`RunStatusIcon` does both). */
  icon: LucideIcon;
  /** The Brand colour token for the glyph and any bare status text: `color: var(<token>)`. */
  token: `--${string}`;
}

// Amber is attention, and only Needs you is attention: waiting on a peer, a
// stop and an idle agent are neutral. Running takes the info ink that
// StatusPill's running tone and the run-mix in-flight slice already use, not
// the accent, so a per-user accent can never make Running read as Done or
// Failed. Failed is always CircleX; the warning triangle is for warnings.
const META: Record<RunStatus, StatusMeta> = {
  running: { label: "Running", icon: CircleDot, token: "--surface-info-text" },
  waiting: { label: "Waiting", icon: Hourglass, token: "--surface-neutral-text" },
  "needs-you": { label: "Needs you", icon: Hand, token: "--surface-warning-text" },
  done: { label: "Done", icon: CircleCheck, token: "--surface-success-text" },
  failed: { label: "Failed", icon: CircleX, token: "--surface-danger-text" },
  stopped: { label: "Stopped", icon: CircleStop, token: "--surface-neutral-text" },
  idle: { label: "Idle", icon: CircleDashed, token: "--surface-neutral-text" },
  unknown: { label: "Unknown", icon: CircleQuestionMark, token: "--surface-neutral-text" },
};

// The vocabularies ui and its products already speak, so each maps here once.
const ALIASES: Record<string, RunStatus> = {
  active: "running", working: "running", in_progress: "running", "in-progress": "running", streaming: "running",
  pending: "waiting", queued: "waiting", blocked: "waiting",
  "attention-needed": "needs-you", needs_you: "needs-you", needs_input: "needs-you", awaiting_input: "needs-you",
  winner: "done", completed: "done", complete: "done", success: "done", succeeded: "done", shipped: "done",
  error: "failed", errored: "failed", "driver-failed": "failed",
  down: "stopped", "no-winner": "stopped", cancelled: "stopped", canceled: "stopped", aborted: "stopped",
};

/** Any status string as a `RunStatus`; a value nothing names reads as Unknown, never as a guess. */
export function runStatus(status: string): RunStatus {
  const key = status.trim().toLowerCase();
  if (Object.hasOwn(META, key)) return key as RunStatus;
  return Object.hasOwn(ALIASES, key) ? ALIASES[key] : "unknown";
}

/** Whether a canonical run state can still advance. */
export const isOpen = (status: RunStatus | (string & {})): boolean => ["running", "waiting", "needs-you"].includes(runStatus(status));

/** The label, glyph and colour token for a status, in every surface. */
export function statusMeta(status: RunStatus | (string & {})): StatusMeta {
  return META[runStatus(status)];
}

export interface RunStatusIconProps extends Omit<LucideProps, "ref"> {
  status: RunStatus | (string & {});
}

/**
 * A status glyph on the icon grid, in its token colour and labelled with its
 * word. Pass `aria-hidden` where the label is already printed beside it.
 * Running breathes on `--motion-ambient`, the page's one loop period; the
 * breathe is opacity only, so it is the essential motion reduced motion keeps.
 */
export function RunStatusIcon({ status, className, style, ...props }: RunStatusIconProps) {
  const key = runStatus(status);
  const { label, icon: Icon, token } = META[key];
  const running = key === "running";
  return (
    <Icon
      role="img"
      aria-label={label}
      size={16}
      strokeWidth={1.75}
      data-run-status={key}
      data-motion={running ? "essential" : undefined}
      className={cn("shrink-0", running && "animate-[tangle-breathe_var(--motion-ambient)_infinite]", className)}
      style={{ color: `var(${token})`, ...style }}
      {...props}
    />
  );
}
