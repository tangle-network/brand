import { memo, useId, useLayoutEffect, useRef, useState } from "react";
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
  /** The command ran past its time limit. */
  timedOut?: boolean;
  /** The signal that ended the command, such as `SIGKILL`. */
  signal?: string;
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
  const timedOut = obj.timedOut ?? obj.timed_out;
  const signal = obj.signal;
  return {
    stdout: text(obj.stdout ?? obj.output),
    stderr: text(obj.stderr),
    exitCode: finiteNumber(obj.exitCode ?? obj.exit_code ?? obj.code),
    ...(timedOut === true ? { timedOut: true } : {}),
    ...(typeof signal === "string" && signal.length > 0 ? { signal } : {}),
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

/** Exit status as a badge. Red only where the command itself is known to have
 *  failed: a nonzero exit, a timeout, or a signal. A tool that reported an
 *  error with nothing recorded about the command (no exit code, or exit 0
 *  from a runner that failed afterwards) gets an amber badge; its error text
 *  prints below. A clean run stays quiet green. */
function ExitBadge({
  output,
  status,
}: {
  output: CommandOutput;
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
  const { exitCode, timedOut, signal } = output;
  let label: string | null;
  let tone: "danger" | "success" | "warning";
  if (timedOut) {
    label = "timed out";
    tone = "danger";
  } else if (signal) {
    label = signal;
    tone = "danger";
  } else if (exitCode !== undefined && exitCode !== 0) {
    label = `exit ${exitCode}`;
    tone = "danger";
  } else if (status === "error") {
    // Say what is known: the tool reported an error. Nothing recorded says
    // the command itself failed.
    label = exitCode === 0 ? "exit 0 · tool reported error" : "tool reported error";
    tone = "warning";
  } else {
    label = exitCode === 0 ? "exit 0" : null;
    tone = "success";
  }
  if (label === null) return null;
  return (
    <span
      className={cn(
        // Every badge has a border, so mixed rows keep one height.
        "inline-flex shrink-0 items-center rounded-full border px-1.5 py-px font-sans text-[11px] font-medium tabular-nums",
        tone === "danger" &&
          "border-transparent bg-[var(--surface-danger-bg)] text-[var(--surface-danger-text)]",
        tone === "success" &&
          "border-transparent bg-[var(--surface-success-bg)] text-[var(--surface-success-text)]",
        // A reported error with nothing recorded about the command deserves
        // attention, but it is not a failed command: amber, not red.
        tone === "warning" &&
          "border-[var(--surface-warning-border)] bg-[var(--surface-warning-bg)] text-[var(--surface-warning-text)]",
      )}
    >
      {label}
    </span>
  );
}

function CommandText({ command }: { command: string }) {
  const tokens = command.split(/(\s+)/);
  return (
    <>
      {tokens.map((token, i) =>
        token.length > 0 && !/\s/.test(token) ? (
          // Tokens repeat (two spaces, two "&&"), so position is the key.
          <span key={i} className="inline-block max-w-full [overflow-wrap:anywhere]">
            {token}
          </span>
        ) : (
          token
        ),
      )}
    </>
  );
}

/**
 * One output stream, capped at a readable height. When the cap hides lines,
 * a control says so and shows the rest in place: a region that ends flush
 * with its frame gave no sign that more output was there.
 */
function OutputRegion({
  label,
  text,
  className,
}: {
  label: string;
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLPreElement>(null);
  const [clipped, setClipped] = useState(false);
  const [full, setFull] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || full) return;
    const check = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [full]);
  const lines = text.replace(/\n$/, "").split("\n").length;
  return (
    <div className={className}>
      <pre
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label={label}
        className={cn(
          "overflow-auto whitespace-pre-wrap [overflow-wrap:anywhere] px-3 py-2 leading-relaxed",
          full ? "" : "max-h-80",
          focusRing,
        )}
      >
        {text}
      </pre>
      {clipped && !full ? (
        <button
          type="button"
          onClick={() => setFull(true)}
          className={cn(
            "w-full border-t border-white/10 px-3 py-1.5 text-left font-sans text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground",
            focusRing,
          )}
        >
          Show all {label} ({lines} lines)
        </button>
      ) : null}
    </div>
  );
}

/**
 * One shell command as a terminal block: a `$ command` prompt line with its
 * exit status, and stdout and stderr in separate regions below it.
 *
 * Closed, a command is a quiet row on the surface it sits on: a list of
 * commands should read as a list, not a stack of black bars. Opened, it is a
 * dark terminal. It scopes the dark token set onto itself with
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
          title={expanded ? undefined : command}
          className={cn(
            "min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]",
            // Closed, two lines of plain text that end in an ellipsis when
            // cut, with the whole command in the title. Opened, each token
            // is a box that wraps whole (line-clamp does not count boxes).
            expanded ? "" : "line-clamp-2",
          )}
        >
          {expanded ? <CommandText command={command} /> : command}
        </code>
        {/* On a phone the badge takes its own line under the command, so the
            command keeps the row's width. */}
        <span className="flex shrink-0 max-sm:order-last max-sm:basis-full max-sm:pl-4">
          <ExitBadge output={output} status={status} />
        </span>
      </>
    );

    return (
      <div
        data-theme={expanded ? "dark" : undefined}
        data-testid="command-preview"
        data-expanded={expanded}
        className={cn(
          // One border in both states, so opening a row does not shift the
          // list; the terminal's is its own fill colour.
          "overflow-hidden rounded-[var(--radius-md)] border font-mono text-xs text-foreground",
          expanded
            ? "border-[var(--md3-surface-container-lowest)] bg-[var(--md3-surface-container-lowest)]"
            : "border-transparent bg-transparent",
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
              "flex w-full flex-wrap items-start gap-x-2 gap-y-1 px-3 py-2 text-left transition-colors sm:flex-nowrap",
              expanded ? "hover:bg-white/5" : "hover:bg-muted",
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
          <div className="flex w-full flex-wrap items-start gap-x-2 gap-y-1 px-3 py-2 sm:flex-nowrap">
            {promptLine}
          </div>
        )}

        {expanded && hasBody ? (
          <div id={bodyId} className="border-t border-white/10">
            {output.stdout ? (
              <OutputRegion
                label="stdout"
                text={output.stdout}
                className=""
              />
            ) : null}
            {output.stderr ? (
              <OutputRegion
                label="stderr"
                text={output.stderr}
                className="border-t border-white/10 text-[var(--surface-danger-text)]"
              />
            ) : null}
            {errorText ? (
              <OutputRegion
                label="error"
                text={errorText}
                className="border-t border-white/10 text-[var(--surface-danger-text)]"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
CommandPreview.displayName = "CommandPreview";
