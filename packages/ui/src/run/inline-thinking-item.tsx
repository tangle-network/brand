import { memo, useEffect, useRef, useState } from "react";
import { Brain } from "lucide-react";
import { truncateText } from "../utils/format";
import type { ReasoningPart } from "../types/parts";
import { Markdown } from "../markdown/markdown";
import { RunRowShell } from "./run-row-shell";
import { ExpandableContent } from "./expandable-content";

export interface InlineThinkingItemProps {
  part: ReasoningPart;
  defaultOpen?: boolean;
  autoCollapse?: boolean;
  className?: string;
  contentClassName?: string;
}

export const InlineThinkingItem = memo(
  ({
    part,
    defaultOpen = false,
    autoCollapse = true,
    className,
    contentClassName,
  }: InlineThinkingItemProps) => {
    const [open, setOpen] = useState(defaultOpen);
    const autoCollapsedRef = useRef(false);

    const startTime = part.time?.start;
    const endTime = part.time?.end;
    const durationMs =
      startTime != null && endTime != null ? endTime - startTime : undefined;
    const isActive = startTime != null && endTime == null;
    const preview = part.text ? truncateText(part.text, 120) : undefined;

    useEffect(() => {
      if (isActive) {
        autoCollapsedRef.current = false;
        setOpen(true);
        return;
      }

      if (autoCollapse && !autoCollapsedRef.current && durationMs != null) {
        const timer = window.setTimeout(() => {
          setOpen(false);
          autoCollapsedRef.current = true;
        }, 900);

        return () => window.clearTimeout(timer);
      }
    }, [autoCollapse, durationMs, isActive]);

    return (
      <RunRowShell
        icon={<Brain className="h-3.5 w-3.5" />}
        accent="violet"
        title={isActive ? "Thinking…" : "Reasoning"}
        description={preview}
        status={isActive ? "running" : "idle"}
        startTime={startTime}
        durationMs={durationMs}
        open={open}
        onOpenChange={setOpen}
        className={className}
        contentClassName="bg-muted"
      >
        {part.text ? (
          <ExpandableContent
            fadeClassName="from-muted"
            className={
              contentClassName ? `px-3 py-3 ${contentClassName}` : "px-3 py-3"
            }
          >
            <div className="text-sm leading-relaxed text-muted-foreground">
              <Markdown>{part.text}</Markdown>
            </div>
          </ExpandableContent>
        ) : (
          <div className="px-3 py-2.5 text-xs text-muted-foreground">
            No reasoning text provided.
          </div>
        )}
      </RunRowShell>
    );
  },
);
InlineThinkingItem.displayName = "InlineThinkingItem";
