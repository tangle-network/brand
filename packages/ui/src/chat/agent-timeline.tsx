import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  FileText,
  Info,
} from "lucide-react";
import { cn } from "../lib/utils";
import { type MessageRole } from "./chat-message";
import { UserMessage } from "./user-message";
import { Markdown } from "../markdown/markdown";
import { ThinkingIndicator } from "./thinking-indicator";
import { type ToolCallData } from "../run/tool-call-feed";
import { ToolCallGroup, ToolCallStep } from "../run/tool-call-step";
import type { ToolPart } from "../types/parts";

export type AgentTimelineTone = "default" | "info" | "success" | "warning" | "error";

export interface AgentTimelineMessageItem {
  id: string;
  kind: "message";
  role: MessageRole;
  content: string;
  toolCalls?: ReactNode;
  isStreaming?: boolean;
  timestamp?: Date;
  after?: ReactNode;
}

export interface AgentTimelineToolItem {
  id: string;
  kind: "tool";
  call: ToolCallData;
  /** Source tool part, so a consumer's `renderToolActions` gets the real
   *  input/output (the flat `call` is display-only). */
  part?: ToolPart;
}

export interface AgentTimelineToolGroupItem {
  id: string;
  kind: "tool_group";
  title?: string;
  calls: ToolCallData[];
  /** Source tool parts, parallel to `calls`. */
  parts?: ToolPart[];
}

export interface AgentTimelineStatusItem {
  id: string;
  kind: "status";
  label: string;
  detail?: string;
  tone?: AgentTimelineTone;
}

export interface AgentTimelineArtifactItem {
  id: string;
  kind: "artifact";
  title: string;
  description?: string;
  meta?: ReactNode;
  icon?: ReactNode;
  tone?: AgentTimelineTone;
  action?: ReactNode;
  onClick?: () => void;
}

export interface AgentTimelineCustomItem {
  id: string;
  kind: "custom";
  content: ReactNode;
}

export type AgentTimelineItem =
  | AgentTimelineMessageItem
  | AgentTimelineToolItem
  | AgentTimelineToolGroupItem
  | AgentTimelineStatusItem
  | AgentTimelineArtifactItem
  | AgentTimelineCustomItem;

export interface AgentTimelineProps {
  items: AgentTimelineItem[];
  isThinking?: boolean;
  emptyState?: ReactNode;
  className?: string;
  /** Optional actions rendered beside each tool item (e.g. "open in artifacts").
   *  Receives the source tool part carried on the item. */
  renderToolActions?: (part: ToolPart) => ReactNode;
  /** When set, collapse the timeline to the first N spine rows behind a
   *  "Show N more steps" toggle. Omit to always show every row. */
  collapseAfter?: number;
}

const TONE_STYLES: Record<AgentTimelineTone, { dot: string; card: string; text: string; icon: typeof Info }> = {
  default: {
    dot: "bg-[var(--border-hover)]",
    card: "border-border bg-card",
    text: "text-foreground",
    icon: CircleDot,
  },
  info: {
    dot: "bg-[var(--surface-info-text)]",
    card: "border-[var(--surface-info-border)] bg-[var(--surface-info-bg)]",
    text: "text-[var(--surface-info-text)]",
    icon: Info,
  },
  success: {
    dot: "bg-[var(--surface-success-text)]",
    card: "border-[var(--surface-success-border)] bg-[var(--surface-success-bg)]",
    text: "text-[var(--surface-success-text)]",
    icon: CheckCircle2,
  },
  warning: {
    dot: "bg-[var(--surface-warning-text)]",
    card: "border-[var(--surface-warning-border)] bg-[var(--surface-warning-bg)]",
    text: "text-[var(--surface-warning-text)]",
    icon: AlertTriangle,
  },
  error: {
    dot: "bg-[var(--surface-danger-text)]",
    card: "border-[var(--surface-danger-border)] bg-[var(--surface-danger-bg)]",
    text: "text-[var(--surface-danger-text)]",
    icon: AlertTriangle,
  },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface AgentTimelineRowProps {
  isLast: boolean;
  accentClassName: string;
  /** Dot top-offset. Defaults to aligning with the first text line; card rows
   * pass CARD_ROW_DOT to center the dot on the card header instead. */
  dotClassName?: string;
  children: ReactNode;
}

// Centers the dot on a RunRowShell card header (2.5rem: h-6 badge + py-2),
// so tool and reasoning rows read as dot-aligned rather than top-anchored.
const CARD_ROW_DOT = "mt-[calc((2.5rem-var(--timeline-dot-size))/2)]";

function AgentTimelineRow({ isLast, accentClassName, dotClassName = "mt-2", children }: AgentTimelineRowProps) {
  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4">
      <div className="relative flex justify-center">
        {!isLast && (
          <span className="absolute top-4 bottom-[-0.75rem] left-1/2 w-px -translate-x-1/2 bg-border" />
        )}
        <span className={cn("relative h-[var(--timeline-dot-size)] w-[var(--timeline-dot-size)] rounded-full ring-4 ring-[var(--bg-root)]", dotClassName, accentClassName)} />
      </div>
      <div className="min-w-0 pb-3">{children}</div>
    </div>
  );
}

function AssistantMessage({ item }: { item: AgentTimelineMessageItem }) {
  return (
    <div className="-mt-0.5">
      {item.timestamp && (
        <div className="mb-2 text-[var(--font-size-xs)] text-muted-foreground">
          {formatTime(item.timestamp)}
        </div>
      )}
      {item.content && (
        <Markdown className="tangle-prose text-[var(--font-size-base)] leading-[var(--line-height-base)]">{item.content}</Markdown>
      )}
      {item.isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-primary align-text-bottom" />
      )}
      {item.toolCalls && <div className="mt-3">{item.toolCalls}</div>}
      {item.after && (
        <div className="mt-3 border-t border-border pt-3">
          {item.after}
        </div>
      )}
    </div>
  );
}

function StatusCard({ item }: { item: AgentTimelineStatusItem }) {
  const tone = TONE_STYLES[item.tone ?? "default"];
  const Icon = tone.icon;

  return (
    <div className={cn("rounded-[var(--radius-lg)] border px-4 py-3", tone.card)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.text)} />
        <div className="min-w-0">
          <div className={cn("text-sm font-medium", tone.text)}>{item.label}</div>
          {item.detail && (
            <div className="mt-0.5 text-sm text-muted-foreground">{item.detail}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtifactCard({ item }: { item: AgentTimelineArtifactItem }) {
  const tone = TONE_STYLES[item.tone ?? "default"];
  const content = (
    <div className={cn("rounded-[var(--radius-lg)] border px-4 py-3", tone.card)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-[var(--avatar-size)] w-[var(--avatar-size)] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted/50 text-foreground">
          {item.icon ?? <FileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{item.title}</div>
          {item.description && (
            <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
          )}
          {item.meta && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {item.meta}
            </div>
          )}
        </div>
        {item.action && <div className="shrink-0">{item.action}</div>}
      </div>
    </div>
  );

  if (!item.onClick) return content;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={item.onClick}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.onClick?.();
        }
      }}
      className="block w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      {content}
    </div>
  );
}

/**
 * AgentTimeline — unified mixed-content timeline for agent-backed sandbox
 * sessions. Renders messages, tool steps, status cards, and artifact handoffs in
 * a single execution narrative.
 */
export function AgentTimeline({
  items,
  isThinking,
  emptyState,
  className,
  renderToolActions,
  collapseAfter,
}: AgentTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0 && !isThinking) {
    return emptyState ? (
      <div className={cn("flex h-full items-center justify-center p-4", className)}>
        {emptyState}
      </div>
    ) : null;
  }

  const renderedItems: AgentTimelineItem[] = isThinking
    ? [...items, { id: "__thinking__", kind: "custom", content: <ThinkingIndicator /> }]
    : items;

  const isUserMessage = (item: AgentTimelineItem) =>
    item.kind === "message" && item.role === "user";

  // Items on the vertical connector (user messages render off-spine).
  const timelineItems = renderedItems.filter((item) => !isUserMessage(item));

  const limit = collapseAfter ?? Infinity;
  const collapsible = timelineItems.length > limit;
  const collapsed = collapsible && !expanded;

  // While collapsed, keep only the first `limit` spine rows (and any user
  // messages that precede them); the rest hides behind the toggle.
  let renderList = renderedItems;
  let hiddenCount = 0;
  if (collapsed) {
    const visible: AgentTimelineItem[] = [];
    let spineCount = 0;
    for (const item of renderedItems) {
      if (spineCount >= limit) break;
      visible.push(item);
      if (!isUserMessage(item)) spineCount += 1;
    }
    renderList = visible;
    hiddenCount = timelineItems.length - limit;
  }

  const visibleSpine = renderList.filter((item) => !isUserMessage(item));
  // When a toggle row follows, no real row is last — the toggle owns the tail.
  const lastSpineItem = collapsible
    ? undefined
    : visibleSpine[visibleSpine.length - 1];

  return (
    <div className={cn("mx-auto w-full max-w-5xl px-4 py-4", className)}>
      {renderList.map((item) => {
        // User messages: right-aligned bubble, off-spine — needs its own vertical
        // rhythm so it doesn't sit flush against the status/tool/agent row below.
        if (item.kind === "message" && item.role === "user") {
          return (
            <div key={item.id} className="mt-6 mb-4 first:mt-0">
              <UserMessage content={item.content} timestamp={item.timestamp} />
            </div>
          );
        }

        const isLast = item === lastSpineItem;

        if (item.kind === "message") {
          return (
            <AgentTimelineRow key={item.id} isLast={isLast} accentClassName="bg-[var(--brand-glow)]">
              <AssistantMessage item={item} />
            </AgentTimelineRow>
          );
        }

        if (item.kind === "tool") {
          return (
            <AgentTimelineRow key={item.id} isLast={isLast} accentClassName="bg-[var(--border-hover)]" dotClassName={CARD_ROW_DOT}>
              <ToolCallStep
                type={item.call.type}
                label={item.call.label}
                status={item.call.status}
                detail={item.call.detail}
                output={item.call.output}
                duration={item.call.duration}
                part={item.part}
                actions={item.part ? renderToolActions?.(item.part) : undefined}
              />
            </AgentTimelineRow>
          );
        }

        if (item.kind === "tool_group") {
          return (
            <AgentTimelineRow key={item.id} isLast={isLast} accentClassName="bg-[var(--border-hover)]" dotClassName={CARD_ROW_DOT}>
              <ToolCallGroup title={item.title}>
                {item.calls.map((call, callIndex) => {
                  const part = item.parts?.[callIndex];
                  return (
                    <ToolCallStep
                      key={call.id}
                      type={call.type}
                      label={call.label}
                      status={call.status}
                      detail={call.detail}
                      output={call.output}
                      duration={call.duration}
                      part={part}
                      actions={part ? renderToolActions?.(part) : undefined}
                    />
                  );
                })}
              </ToolCallGroup>
            </AgentTimelineRow>
          );
        }

        if (item.kind === "status") {
          return (
            <AgentTimelineRow
              key={item.id}
              isLast={isLast}
              accentClassName={TONE_STYLES[item.tone ?? "default"].dot}
            >
              <StatusCard item={item} />
            </AgentTimelineRow>
          );
        }

        if (item.kind === "artifact") {
          return (
            <AgentTimelineRow
              key={item.id}
              isLast={isLast}
              accentClassName={TONE_STYLES[item.tone ?? "default"].dot}
            >
              <ArtifactCard item={item} />
            </AgentTimelineRow>
          );
        }

        // custom
        return (
          <AgentTimelineRow key={item.id} isLast={isLast} accentClassName="bg-[var(--border-hover)]" dotClassName={CARD_ROW_DOT}>
            {(item as AgentTimelineCustomItem).content}
          </AgentTimelineRow>
        );
      })}
      {collapsible ? (
        <AgentTimelineRow isLast accentClassName="bg-[var(--border-hover)]">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {collapsed
              ? `Show ${hiddenCount} more step${hiddenCount === 1 ? "" : "s"}`
              : "Show less"}
          </button>
        </AgentTimelineRow>
      ) : null}
    </div>
  );
}
