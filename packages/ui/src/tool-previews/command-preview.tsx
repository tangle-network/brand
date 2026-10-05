import { memo, useId, useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";
import type { ToolPart } from "../types/parts";

export interface CommandPreviewProps {
  part: ToolPart;
  /**
   * Show the output without a click. Off by default: a run is read as a list of
   * commands, and the output of the one that matters is a click away. A surface
   * that is itself an expansion (an opened tool row) turns it on.
   */
  defaultExpanded?: boolean;
  className?: string;
}

/** The input keys a shell tool names its command under. */
const COMMAND_KEYS = ["command", "cmd", "script", "commandLine"] as const;

/** The command a shell tool ran, from a structured input or a raw string. */
export function commandOf(input: unknown): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const key of COMMAND_KEYS) {
      const value = obj[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
  }
  return "";
}

export interface CommandOutput {
  stdout: string;
  stderr: string;
  /** Undefined when the producer persisted plain text and never reported one. */
  exitCode: number | undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Split a tool's output into stdout, stderr and an exit code.
 *
 * Accepts both shapes producers persist: a structured `{ stdout, stderr,
 * exitCode }` (or `output` / `exit_code` / `code`), and the plain string a
 * workflow stores. A string carries no exit code, so none is invented.
 */
export function extractCommandOutput(output: unknown): CommandOutput {
  if (output === undefined || output === null) {
    return { stdout: "", stderr: "", exitCode: undefined };
  }
  if (typeof output === "string") {
    const parsed = parseStructured(output);
    if (parsed) return parsed;
    return { stdout: output, stderr: "", exitCode: undefined };
  }
  if (typeof output === "object") {
    return fromObject(output as Record<string, unknown>);
  }
  return { stdout: String(output), stderr: "", exitCode: undefined };
}

function fromObject(obj: Record<string, unknown>): CommandOutput {
  const text = (value: unknown) =>
    value === undefined || value === null ? "" : String(value);
  return {
    stdout: text(obj.stdout ?? obj.output),
    stderr: text(obj.stderr),
    exitCode: finiteNumber(obj.exitCode ?? obj.exit_code ?? obj.code),
  };
}

/** The keys a serialized command result carries, and nothing else. */
const ENVELOPE_KEYS = new Set([
  "stdout",
  "stderr",
  "output",
  "exitCode",
  "exit_code",
  "code",
  "signal",
  "durationMs",
  "duration_ms",
  "timedOut",
  "timed_out",
]);

/** A string that is a serialized `{ stdout, stderr, exitCode }` record. */
function parseStructured(text: string): CommandOutput | undefined {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("{")) return undefined;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    const obj = parsed as Record<string, unknown>;
    // Only an unambiguous envelope: a stream key, and nothing but envelope keys.
    // A command whose own stdout is JSON that happens to have a `stdout` field
    // (`{"stdout":"v","result":"ok"}`) is shown as the text it printed.
    if (!("stdout" in obj) && !("stderr" in obj)) return undefined;
    if (!Object.keys(obj).every((key) => ENVELOPE_KEYS.has(key))) {
      return undefined;
    }
    return fromObject(obj);
  } catch {
    return undefined;
  }
}

/** Exit status as a badge: the code when one is known, else the tool's status.
 *  Red only for a nonzero exit or an error; a clean run stays quiet green. */
function ExitBadge({
  exitCode,
  status,
}: {
  exitCode: number | undefined;
  status: ToolPart["state"]["status"];
}) {
  if (status === "running" || status === "pending") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        running
      </span>
    );
  }
  // The tool's own error status wins: a runner can fail after the shell exited
  // 0, and a green "exit 0" beside that error would contradict it.
  const failed = status === "error" || (exitCode !== undefined && exitCode !== 0);
  const label =
    exitCode !== undefined ? `exit ${exitCode}` : failed ? "error" : null;
  if (label === null) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums",
        failed
          ? "bg-[var(--surface-danger-bg)] text-[var(--surface-danger-text)]"
          : "bg-[var(--surface-success-bg)] text-[var(--surface-success-text)]",
      )}
    >
      {label}
    </span>
  );
}

/**
 * One shell command as a terminal block: a `$ command` prompt line with its
 * exit status, and stdout and stderr in separate regions below it.
 *
 * The block is always dark. It scopes the dark token set onto itself with
 * `data-theme="dark"`, so stderr, the badges and the muted prompt keep the
 * contrast they were designed with on a dark ground, in a light console too.
 */
export const CommandPreview = memo(
  ({ part, defaultExpanded = false, className }: CommandPreviewProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const bodyId = useId();
    const command = commandOf(part.state.input);
    const { status } = part.state;
    const output = extractCommandOutput(part.state.output);
    // A failed call often persists the same text twice — as its output and as
    // its error. Print it once. Only an exact repeat (ignoring whitespace) is
    // folded: an error that merely CONTAINS the output, or the reverse, is a
    // distinct message and keeps its own region.
    const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
    const errorRepeats =
      part.state.error !== undefined &&
      output.stdout.length > 0 &&
      normalize(part.state.error) === normalize(output.stdout);
    const errorText = errorRepeats ? undefined : part.state.error;
    const hasBody =
      output.stdout.length > 0 ||
      output.stderr.length > 0 ||
      (errorText !== undefined && errorText.length > 0);

    const promptLine = (
      <>
        <span aria-hidden="true" className="shrink-0 select-none text-muted-foreground">
          $
        </span>
        <code
          className={cn(
            "min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]",
            expanded ? "" : "line-clamp-2",
          )}
        >
          {command}
        </code>
        <ExitBadge exitCode={output.exitCode} status={status} />
      </>
    );

    return (
      <div
        data-theme="dark"
        data-testid="command-preview"
        className={cn(
          "overflow-hidden rounded-[var(--radius-md)] bg-[var(--md3-surface-container-lowest)] font-mono text-xs text-foreground",
          className,
        )}
      >
        {hasBody ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={bodyId}
            className={cn(
              "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5",
              focusRing,
            )}
          >
            {promptLine}
            {expanded ? (
              <ChevronDown className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronRight className="mt-px h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        ) : (
          <div className="flex w-full items-start gap-2 px-3 py-2">{promptLine}</div>
        )}

        {expanded && hasBody ? (
          <div id={bodyId} className="border-t border-white/10">
            {output.stdout ? (
              <pre
                tabIndex={0}
                aria-label="stdout"
                className={cn(
                  "max-h-80 overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere] px-3 py-2 leading-relaxed",
                  focusRing,
                )}
              >
                {output.stdout}
              </pre>
            ) : null}
            {output.stderr ? (
              <pre
                tabIndex={0}
                aria-label="stderr"
                className={cn(
                  "max-h-80 overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere] border-t border-white/10 px-3 py-2 leading-relaxed text-[var(--surface-danger-text)]",
                  focusRing,
                )}
              >
                {output.stderr}
              </pre>
            ) : null}
            {errorText ? (
              <pre
                tabIndex={0}
                aria-label="error"
                className={cn(
                  "max-h-80 overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere] border-t border-white/10 px-3 py-2 leading-relaxed text-[var(--surface-danger-text)]",
                  focusRing,
                )}
              >
                {errorText}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
CommandPreview.displayName = "CommandPreview";
