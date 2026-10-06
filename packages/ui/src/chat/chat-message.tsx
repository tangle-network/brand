/**
 * ChatMessage — one message in the conversation.
 *
 * Supports user messages (plain text) and assistant messages
 * (rich markdown with inline tool call activity). With `author` and
 * `viewerId` it renders a transcript shared by several people: the reader's
 * own messages stay at the end, everyone else's sit at the start under
 * their author.
 */

import { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Markdown } from "../markdown/markdown";
import type { ChatAuthor } from "../types/message";
import { isViewerMessage, MessageAuthor } from "./message-author";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessageProps {
  role: MessageRole;
  content: string;
  /** Inline tool call activity rendered between text chunks */
  toolCalls?: ReactNode;
  /** Whether the message is still streaming */
  isStreaming?: boolean;
  /** Timestamp */
  timestamp?: Date;
  className?: string;
  /** Custom user label. Default: "You" */
  userLabel?: string;
  /** Custom assistant label. Default: "Agent" */
  assistantLabel?: string;
  /** Hide the role label row entirely */
  hideRoleLabel?: boolean;
  /**
   * Who wrote the message, when more than one person shares the transcript.
   * It replaces the role label with the author's avatar, name and role,
   * except on the reader's own messages, which keep `userLabel`.
   */
  author?: ChatAuthor;
  /**
   * The reader's participant id. A user message whose `author` has another
   * id is someone else's: it sits at the start, on a card, under its author.
   */
  viewerId?: string;
}

export function ChatMessage({
  role,
  content,
  toolCalls,
  isStreaming,
  timestamp,
  className,
  userLabel = "You",
  assistantLabel = "Agent",
  hideRoleLabel,
  author,
  viewerId,
}: ChatMessageProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const fromViewer = isUser && isViewerMessage(author, viewerId);
  const fromOtherPerson = isUser && !fromViewer;
  const shownAuthor = fromViewer ? undefined : author;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        fromViewer ? "items-end" : "items-start",
        className,
      )}
    >
      {!hideRoleLabel && (
        <div className={cn("flex items-center gap-2 px-1", fromViewer && "flex-row-reverse")}>
          {shownAuthor ? (
            <MessageAuthor author={shownAuthor} />
          ) : (
            <span className="font-medium text-foreground text-xs">
              {isUser ? userLabel : assistantLabel}
            </span>
          )}
          {timestamp && (
            <span className="text-muted-foreground text-xs">
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "min-w-0 max-w-[85%] space-y-1",
          fromViewer
            ? "rounded-[var(--radius-lg)] bg-foreground px-[var(--chat-message-px)] py-[var(--chat-message-py)] text-background"
            : fromOtherPerson
              ? "rounded-[var(--radius-lg)] border border-border bg-card px-[var(--chat-message-px)] py-[var(--chat-message-py)] text-foreground"
              : isAssistant
                ? "text-foreground"
                : "rounded-[var(--radius-lg)] border border-border bg-card px-[var(--chat-message-px)] py-[var(--chat-message-py)]",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap text-[length:var(--font-size-base)] leading-[var(--line-height-base)]">
            {content}
          </div>
        ) : (
          <>
            {content && <Markdown className="tangle-prose text-[length:var(--font-size-base)] leading-[var(--line-height-base)]">{content}</Markdown>}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-[var(--brand-cool)] align-text-bottom" />
            )}
          </>
        )}

        {/* Inline tool calls (left-aligned below agent text) */}
        {toolCalls}
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
