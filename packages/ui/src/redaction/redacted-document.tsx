import { useCallback, useState, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";

/**
 * Viewer for a server-produced redacted document. Renders text inline and each
 * redacted span as a masked chip; clicking a chip asks the server to reveal that
 * one span. The original plaintext is NEVER in the document the client holds —
 * the chip carries only an id + kind; `onReveal` round-trips to the server, where
 * `@tangle-network/agent-app/redact`'s `revealSpan` runs the authorization check
 * and writes the audit trail. So authz + audit are server-truth; this is display.
 *
 * Structural types (no `@tangle-network/agent-app` dependency) — the viewer needs
 * only `{ id, kind }` per span; the cipher stays server-side.
 */

export type RedactedDocSegment =
  | { type: "text"; text: string }
  | { type: "redacted"; id: string; kind: string };

export interface RedactedDocumentData {
  segments: RedactedDocSegment[];
}

export interface RevealResult {
  ok: boolean;
  value?: string;
  /** e.g. `forbidden` | `not_found` when `ok` is false. */
  reason?: string;
}

export interface RedactedDocumentProps {
  document: RedactedDocumentData;
  /** Reveal one span by id. Wire to a server route that calls agent-app's
   *  `revealSpan` (authz + audit happen there). Resolves with the original. */
  onReveal: (spanId: string) => Promise<RevealResult>;
  /** Display label for a redaction kind (default: the kind, upper-cased). */
  labelForKind?: (kind: string) => string;
  className?: string;
}

type ChipState =
  | { status: "masked" }
  | { status: "loading" }
  | { status: "revealed"; value: string }
  | { status: "denied"; reason?: string };

const defaultLabel = (kind: string) => kind.replace(/[-_]/g, " ").toUpperCase();

function RedactedChip({
  kind,
  label,
  onReveal,
}: {
  kind: string;
  label: string;
  onReveal: () => Promise<RevealResult>;
}) {
  const [state, setState] = useState<ChipState>({ status: "masked" });

  const reveal = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const r = await onReveal();
      setState(
        r.ok && r.value !== undefined
          ? { status: "revealed", value: r.value }
          : { status: "denied", reason: r.reason },
      );
    } catch {
      setState({ status: "denied", reason: "error" });
    }
  }, [onReveal]);

  if (state.status === "revealed") {
    return (
      <button
        type="button"
        onClick={() => setState({ status: "masked" })}
        title="Revealed — click to hide"
        aria-label={`${label}: revealed, click to hide`}
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1 font-medium",
          "bg-[color-mix(in_oklch,var(--color-warning,orange)_18%,transparent)] text-foreground ring-1 ring-warning/40",
        )}
      >
        {state.value}
        <EyeOff className="size-3 opacity-60" />
      </button>
    );
  }

  if (state.status === "denied") {
    return (
      <span
        title={`Restricted${state.reason ? ` (${state.reason})` : ""}`}
        aria-label={`${label}: restricted`}
        className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-muted px-1 text-muted-foreground"
      >
        <ShieldAlert className="size-3" /> {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={state.status === "loading"}
      onClick={reveal}
      title={`${label} — click to reveal`}
      aria-label={`${label} redacted, click to reveal`}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1 font-medium tracking-wide",
        "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors",
        "cursor-pointer select-none",
      )}
    >
      {state.status === "loading" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Eye className="size-3 opacity-60" />
      )}
      <span aria-hidden>{"███"}</span> {label}
    </button>
  );
}

export function RedactedDocument({
  document,
  onReveal,
  labelForKind = defaultLabel,
  className,
}: RedactedDocumentProps): ReactNode {
  return (
    <div className={cn("whitespace-pre-wrap break-words leading-relaxed", className)}>
      {document.segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <RedactedChip
            key={seg.id}
            kind={seg.kind}
            label={labelForKind(seg.kind)}
            onReveal={() => onReveal(seg.id)}
          />
        ),
      )}
    </div>
  );
}
