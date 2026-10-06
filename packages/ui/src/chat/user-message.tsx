import { memo, type ReactNode } from "react";
import type { ChatAuthor, SessionMessage } from "../types/message";
import type { SessionPart } from "../types/parts";
import { isViewerMessage, MessageAuthor } from "./message-author";
import { SyntheticText, userTextSegments } from "./synthetic-text";

export interface UserMessageProps {
  /** Session-model input: text is derived from these parts. */
  message?: SessionMessage;
  parts?: SessionPart[];
  /** Direct-content input (e.g. AgentTimeline): explicit text + timestamp. */
  content?: string;
  timestamp?: Date;
  actions?: ReactNode;
  /**
   * Who wrote the message, when more than one person shares the transcript.
   * Omit it in a two-party chat: the message renders as the reader's.
   */
  author?: ChatAuthor;
  /**
   * The reader's participant id. A message whose `author` has another id is
   * someone else's: it sits at the start, on a card, under its author.
   */
  viewerId?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function MessageActions({ children, align = "end" }: { children: ReactNode; align?: "start" | "end" }) {
  return (
    <div className={`flex flex-wrap items-center ${align === "end" ? "justify-end" : "justify-start"} gap-1.5 text-xs text-muted-foreground`}>
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
              className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap text-[length:var(--font-size-xs)] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              {formatTime(timestamp)}
            </span>
          ) : null}
          <div className="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">
            {text}
          </div>
        </div>
        {actions ? <MessageActions>{actions}</MessageActions> : null}
      </div>
    </div>
  );
}

/**
 * Another person's speech: start-aligned under its author, on a card rather
 * than the reader's inverse fill, so "mine" and "theirs" differ before the
 * names are read. The timestamp is revealed on the bubble's far side.
 */
function OtherPersonBubble({ text, timestamp, actions, author }: {
  text: string;
  timestamp?: Date;
  actions?: ReactNode;
  /** The author line; absent on a later segment of the same message. */
  author?: ChatAuthor;
}) {
  return (
    <div className="flex justify-start">
      <div className="group flex min-w-0 max-w-[78%] flex-col items-start gap-1.5">
        {author ? <MessageAuthor author={author} /> : null}
        <div className="relative min-w-0 max-w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground">
          {timestamp ? (
            <span
              data-user-message-time=""
              className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap text-[length:var(--font-size-xs)] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              {formatTime(timestamp)}
            </span>
          ) : null}
          <div className="break-words whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[1.5]">
            {text}
          </div>
        </div>
        {actions ? <MessageActions align="start">{actions}</MessageActions> : null}
      </div>
    </div>
  );
}

/**
 * User speech retains the inverse-theme bubble and direct-content contract.
 * Application notes interrupt the bubble in source order, outside its attribution.
 */
export const UserMessage = memo(
  ({ message: _message, parts, content, timestamp, actions, author, viewerId }: UserMessageProps) => {
    const other = isViewerMessage(author, viewerId) ? undefined : author;
    // `headed` puts the author line on the first spoken segment only.
    const bubble = (text: string, bubbleActions?: ReactNode, headed = true, key?: number) =>
      other ? (
        <OtherPersonBubble key={key} text={text} timestamp={timestamp} actions={bubbleActions} author={headed ? other : undefined} />
      ) : (
        <UserBubble key={key} text={text} timestamp={timestamp} actions={bubbleActions} />
      );
    // Explicit direct content (including empty content) still overrides parts.
    if (content != null) {
      return content.trim() ? bubble(content, actions) : null;
    }
    const segments = userTextSegments(parts ?? []);
    if (segments.length === 0) return null;
    if (segments.length === 1 && !segments[0].synthetic) {
      return bubble(segments[0].text, actions);
    }
    const firstSpoken = segments.find((segment) => !segment.synthetic);
    return (
      <div className="space-y-2">
        {segments.map((segment) => segment.synthetic ? (
          <SyntheticText key={segment.index} text={segment.text} />
        ) : (
          bubble(segment.text, undefined, segment === firstSpoken, segment.index)
        ))}
        {actions ? <MessageActions align={other ? "start" : "end"}>{actions}</MessageActions> : null}
      </div>
    );
  },
);
UserMessage.displayName = "UserMessage";
