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
 * The single user message bubble — a quiet, right-aligned fill on the muted
 * surface (no border, no loud fill, no uppercase label). The timestamp sits
 * beside the bubble and appears on hover, so it costs no height. Used by both
 * the run/message list (session-model `parts`) and AgentTimeline (direct
 * `content`/`timestamp`).
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
        <div className="group flex max-w-[78%] flex-col items-end gap-2">
          <div className="relative w-full rounded-2xl bg-muted/50 px-4 py-3">
            {timestamp ? (
              <span
                data-user-message-time=""
                className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap text-[var(--font-size-xs)] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                {formatTime(timestamp)}
              </span>
            ) : null}
            <div className="whitespace-pre-wrap text-[var(--font-size-base)] leading-[1.5] text-foreground">
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
