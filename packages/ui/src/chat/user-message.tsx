import { memo, type ReactNode } from "react";
import type { SessionMessage } from "../types/message";
import type { SessionPart } from "../types/parts";
import { SyntheticText, userTextSegments } from "./synthetic-text";

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

function MessageActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function UserBubble({ text, timestamp, actions }: {
  text: string;
  timestamp?: Date;
  actions?: ReactNode;
}) {
  return (
    <div className="flex justify-end">
      <div className="group flex min-w-0 max-w-[78%] flex-col items-end gap-2">
        <div className="relative w-full min-w-0 rounded-2xl bg-foreground px-4 py-3 text-background">
          {timestamp ? (
            <span
              data-user-message-time=""
              className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap text-[var(--font-size-xs)] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              {formatTime(timestamp)}
            </span>
          ) : null}
          <div className="break-words whitespace-pre-wrap text-[var(--font-size-base)] leading-[1.5]">
            {text}
          </div>
        </div>
        {actions ? <MessageActions>{actions}</MessageActions> : null}
      </div>
    </div>
  );
}

/**
 * User speech retains the inverse-theme bubble and direct-content contract.
 * Application notes interrupt the bubble in source order, outside its attribution.
 */
export const UserMessage = memo(
  ({ message: _message, parts, content, timestamp, actions }: UserMessageProps) => {
    // Explicit direct content (including empty content) still overrides parts.
    if (content != null) {
      return content.trim() ? <UserBubble text={content} timestamp={timestamp} actions={actions} /> : null;
    }
    const segments = userTextSegments(parts ?? []);
    if (segments.length === 0) return null;
    if (segments.length === 1 && !segments[0].synthetic) {
      return <UserBubble text={segments[0].text} timestamp={timestamp} actions={actions} />;
    }
    return (
      <div className="space-y-2">
        {segments.map((segment) => segment.synthetic ? (
          <SyntheticText key={segment.index} text={segment.text} />
        ) : (
          <UserBubble key={segment.index} text={segment.text} timestamp={timestamp} />
        ))}
        {actions ? <MessageActions>{actions}</MessageActions> : null}
      </div>
    );
  },
);
UserMessage.displayName = "UserMessage";
