/**
 * ChatMessage — single message bubble in the conversation.
 *
 * Supports user messages (plain text) and assistant messages
 * (rich markdown with inline tool call activity).
 */

import { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Markdown } from "../markdown/markdown";

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
  /** @deprecated Avatars were removed from the bubble design; this prop is ignored. */
  hideAvatar?: boolean;
  /** @deprecated Avatars were removed from the bubble design; this prop is ignored. */
  avatar?: ReactNode;
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
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
        className,
      )}
    >
      {!hideRoleLabel && (
        <div className={cn("flex items-center gap-2 px-1", isUser && "flex-row-reverse")}>
          <span className="font-medium text-foreground text-xs">
            {isUser ? userLabel : assistantLabel}
          </span>
          {timestamp && (
            <span className="text-muted-foreground text-xs">
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "min-w-0 max-w-[85%] space-y-1 rounded-[var(--radius-lg)] border",
          "px-[var(--chat-message-px)] py-[var(--chat-message-py)]",
          isUser
            ? "border-border bg-muted/50"
            : "border-border bg-card",
        )}
      >
        {/* Message body */}
        {isUser ? (
          <div className="whitespace-pre-wrap text-[var(--font-size-base)] leading-[var(--line-height-base)] text-foreground">
            {content}
          </div>
        ) : (
          <>
            {content && <Markdown className="tangle-prose text-[var(--font-size-base)] leading-[var(--line-height-base)]">{content}</Markdown>}
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
