import { memo, type ReactNode } from "react";
import type { SessionMessage } from "../types/message";
import type { SessionPart } from "../types/parts";

export interface UserMessageProps {
  /** Session-model input: text is derived from these parts. */
  message?: SessionMessage;
  parts?: SessionPart[];
  /** Direct-content input (e.g. AgentTimeline): explicit text + timestamp. */
  content?: string;
  timestamp?: Date;
  actions?: ReactNode;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * The single user message bubble — a quiet, right-aligned bordered bubble on the
 * muted surface (no loud fill, no uppercase label). Used by both the run/message
 * list (session-model `parts`) and AgentTimeline (direct `content`/`timestamp`).
 */
export const UserMessage = memo(
  ({ message: _message, parts, content, timestamp, actions }: UserMessageProps) => {
    const text =
      content ??
      (parts ?? [])
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("\n");

    if (!text.trim()) return null;

    return (
      <div className="flex justify-end">
        <div className="flex max-w-[78%] flex-col items-end gap-2">
          <div className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-3">
            {timestamp ? (
              <div className="mb-1.5 text-right text-[var(--font-size-xs)] text-muted-foreground">
                {formatTime(timestamp)}
              </div>
            ) : null}
            <div className="whitespace-pre-wrap text-[var(--font-size-base)] leading-[var(--line-height-base)] text-foreground">
              {text}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);
UserMessage.displayName = "UserMessage";
