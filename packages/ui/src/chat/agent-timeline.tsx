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
  /** Shown beside a user bubble on hover. Assistant prose carries no
   *  timestamp of its own — the turn's user message dates the exchange. */
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
  /** Accessible name of the group. Not drawn — the rows are the label. */
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
  /** Laid out as a run row: it takes the same horizontal bleed as tool rows,
   *  so a `RunRowShell`-based row (reasoning) aligns its glyph with the prose
   *  edge. */
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
  /** When set, collapse the timeline to the first N step rows (every item
   *  except user messages) behind a "Show N more steps" toggle. Omit to always
   *  show every row. */
  collapseAfter?: number;
}

const TONE_STYLES: Record<AgentTimelineTone, { card: string; text: string; icon: typeof Info }> = {
  default: {
    card: "border-border bg-card",
    text: "text-foreground",
    icon: CircleDot,
  },
  info: {
    card: "border-[var(--surface-info-border)] bg-[var(--surface-info-bg)]",
    text: "text-[var(--surface-info-text)]",
    icon: Info,
  },
  success: {
    card: "border-[var(--surface-success-border)] bg-[var(--surface-success-bg)]",
    text: "text-[var(--surface-success-text)]",
    icon: CheckCircle2,
  },
  warning: {
    card: "border-[var(--surface-warning-border)] bg-[var(--surface-warning-bg)]",
    text: "text-[var(--surface-warning-text)]",
    icon: AlertTriangle,
  },
  error: {
    card: "border-[var(--surface-danger-border)] bg-[var(--surface-danger-bg)]",
    text: "text-[var(--surface-danger-text)]",
    icon: AlertTriangle,
  },
};

/**
 * Vertical rhythm. Rows are grouped by what they are, and the gap between two
 * neighbours follows from the pair: a turn boundary (user message) separates
 * most, a tool sequence — and prose beside it — sits tightest, cards and
 * consecutive paragraphs fall between.
 */
type StepKind = "user" | "prose" | "tool" | "card";

function stepKind(item: AgentTimelineItem): StepKind {
  if (item.kind === "message") return item.role === "user" ? "user" : "prose";
  if (item.kind === "status" || item.kind === "artifact") return "card";
  return "tool";
}

function spacingBefore(prev: StepKind | undefined, next: StepKind): string {
  if (prev === undefined) return "";
  if (prev === "user" || next === "user") return "mt-4";
  if (prev === "card" || next === "card") return "mt-2";
  if (prev === "tool" || next === "tool") return "mt-1";
  return "mt-3";
}

// Tool rows bleed past the prose edge so the resting glyph sits ON the edge:
// RunRowShell's 8px header inset plus the 4px that centers a 14px glyph in its
// 22px slot = 12px. The hover fill then wraps the row. The column's `px-4` is
// wider than the bleed, so nothing clips.
const ROW_BLEED = "-mx-3";

function AssistantMessage({ item }: { item: AgentTimelineMessageItem }) {
  return (
    <div>
      {item.content && (
        <Markdown className="tangle-prose text-[var(--font-size-base)] leading-[1.5]">{item.content}</Markdown>
      )}
      {item.isStreaming && (
        <span
          aria-hidden
          data-streaming-caret=""
          className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse rounded-full bg-muted-foreground align-text-bottom"
        />
      )}
      {item.toolCalls && <div className="mt-1">{item.toolCalls}</div>}
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
 * AgentTimeline — unified mixed-content transcript for agent-backed sandbox
 * sessions. Renders messages, tool rows, status cards, and artifact handoffs
 * as one plain column: prose at the reading size, tool calls as quiet
 * one-liners between the paragraphs, no connector chrome.
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

  // Step rows are everything but user messages; the collapse limit counts them.
  const stepItems = renderedItems.filter((item) => !isUserMessage(item));

  const limit = collapseAfter ?? Infinity;
  const collapsible = stepItems.length > limit;
  const collapsed = collapsible && !expanded;

  // While collapsed, keep only the first `limit` step rows (and any user
  // messages that precede them); the rest hides behind the toggle.
  let renderList = renderedItems;
  let hiddenCount = 0;
  if (collapsed) {
    const visible: AgentTimelineItem[] = [];
    let stepCount = 0;
    for (const item of renderedItems) {
      if (stepCount >= limit) break;
      visible.push(item);
      if (!isUserMessage(item)) stepCount += 1;
    }
    renderList = visible;
    hiddenCount = stepItems.length - limit;
  }

  const renderItem = (item: AgentTimelineItem): ReactNode => {
    if (item.kind === "message") {
      return item.role === "user" ? (
        <UserMessage content={item.content} timestamp={item.timestamp} />
      ) : (
        <AssistantMessage item={item} />
      );
    }

    if (item.kind === "tool") {
      return (
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
      );
    }

    if (item.kind === "tool_group") {
      return (
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
      );
    }

    if (item.kind === "status") return <StatusCard item={item} />;
    if (item.kind === "artifact") return <ArtifactCard item={item} />;
    return item.content;
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-5xl flex-col px-4 py-4", className)}>
      {renderList.map((item, index) => {
        const kind = stepKind(item);
        const prev = index > 0 ? stepKind(renderList[index - 1]) : undefined;
        return (
          <div
            key={item.id}
            data-timeline-step={kind}
            className={cn(spacingBefore(prev, kind), kind === "tool" && ROW_BLEED)}
          >
            {renderItem(item)}
          </div>
        );
      })}
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {collapsed
            ? `Show ${hiddenCount} more step${hiddenCount === 1 ? "" : "s"}`
            : "Show less"}
        </button>
      ) : null}
    </div>
  );
}
