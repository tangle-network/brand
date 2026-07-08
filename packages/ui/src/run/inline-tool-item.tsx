import { memo, type ComponentType, type ReactNode } from "react";
import {
  Terminal,
  FileEdit,
  FileSearch,
  Search,
  PencilLine,
  Bot,
  Globe,
  ClipboardList,
  Settings,
  type LucideProps,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  getToolDisplayMetadata,
  getToolErrorText,
  getToolCategory,
} from "../utils/tool-display";
import type { ToolPart } from "../types/parts";
import type { ToolCategory } from "../types/run";
import type { CustomToolRenderer } from "../types/tool-display";
import { ExpandedToolDetail } from "./expanded-tool-detail";
import { RunRowShell, type RunRowStatus } from "./run-row-shell";

/** Map tool category to a lucide-react icon component. */
const TOOL_CATEGORY_ICON_MAP: Record<
  ToolCategory,
  ComponentType<LucideProps>
> = {
  command: Terminal,
  write: FileEdit,
  read: FileSearch,
  search: Search,
  edit: PencilLine,
  task: Bot,
  web: Globe,
  todo: ClipboardList,
  other: Settings,
};

export interface InlineToolItemProps {
  part: ToolPart;
  renderToolDetail?: CustomToolRenderer;
  groupPosition?: "single" | "first" | "middle" | "last";
  className?: string;
  contentClassName?: string;
  actions?: ReactNode;
  /** Override the derived title (default: from `getToolDisplayMetadata`). */
  title?: string;
  /** Override the derived inline description. */
  description?: string;
}

/** Map the tool part status onto the shared row status vocabulary. */
function toRowStatus(status: ToolPart["state"]["status"]): RunRowStatus {
  if (status === "pending" || status === "running") return "running";
  if (status === "error") return "error";
  return "success";
}

/**
 * Compact single-line tool call display. Shows a category icon, title,
 * description, duration and status, and expands on click to show
 * ExpandedToolDetail. Rendered through the shared RunRowShell so it stays
 * consistent with the reasoning row.
 */
export const InlineToolItem = memo(
  ({
    part,
    renderToolDetail,
    groupPosition = "single",
    className,
    contentClassName,
    actions,
    title: titleOverride,
    description: descriptionOverride,
  }: InlineToolItemProps) => {
    const meta = getToolDisplayMetadata(part);
    const title = titleOverride ?? meta.title;
    const description = descriptionOverride ?? meta.description;
    const errorText = getToolErrorText(part);

    const startTime = part.state.time?.start;
    const endTime = part.state.time?.end;
    const durationMs =
      startTime != null && endTime != null ? endTime - startTime : undefined;

    const category = getToolCategory(part.tool);
    const DefaultIcon = TOOL_CATEGORY_ICON_MAP[category] ?? Settings;

    return (
      <RunRowShell
        icon={<DefaultIcon className="h-3.5 w-3.5" />}
        title={title}
        description={description}
        descriptionMono
        status={toRowStatus(part.state.status)}
        startTime={startTime}
        durationMs={durationMs}
        groupPosition={groupPosition}
        collapsedError={errorText ?? undefined}
        actions={actions}
        className={className}
        contentClassName={cn("p-2", contentClassName)}
      >
        {renderToolDetail?.(part) ?? <ExpandedToolDetail part={part} />}
      </RunRowShell>
    );
  },
);
InlineToolItem.displayName = "InlineToolItem";
