/**
 * FileTabs: one tab per open file. The strip sits on its host's chrome plane and
 * draws its baseline as an inset shadow (a host whose border is the baseline
 * passes `shadow-none`); the active tab paints the card plane over it, so it
 * joins the content below. A long name is cut in the middle, keeping its end
 * and extension. Arrow keys, Home and End move the selection; Delete closes.
 */

import { useEffect, useRef, type KeyboardEvent } from "react";
import { X, FileText, FileCode, FileSpreadsheet } from "lucide-react";
import { focusRingInset } from "../lib/focus";
import { controlMotion } from "../lib/motion";
import { cn } from "../lib/utils";

export interface FileTabData {
  id: string;
  name: string;
  path: string;
  dirty?: boolean;
}

export interface FileTabsProps {
  tabs: FileTabData[];
  activeId?: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** Accessible name of the tab list. Defaults to "Open files". */
  label?: string;
  className?: string;
}

function getTabIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return FileText;
  if (["csv", "xlsx"].includes(ext)) return FileSpreadsheet;
  return FileCode;
}

/** A long name keeps its extension and the characters before it after the ellipsis. */
function splitName(name: string): [string, string] {
  if (name.length <= 18) return [name, ""];
  const dot = name.lastIndexOf(".");
  const keep = Math.min(Math.max((dot > 0 ? name.length - dot : 0) + 6, 8), 12);
  return [name.slice(0, -keep), name.slice(-keep)];
}

export function FileTabs({ tabs, activeId, onSelect, onClose, label = "Open files", className }: FileTabsProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Reveal the active tab inside the strip only; scrollIntoView would also scroll the page.
  useEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.querySelector<HTMLElement>('[aria-selected="true"]')?.parentElement;
    if (strip && tab) strip.scrollLeft = Math.min(tab.offsetLeft, Math.max(strip.scrollLeft, tab.offsetLeft + tab.offsetWidth - strip.clientWidth));
  }, [activeId, tabs.length]);

  if (tabs.length === 0) return null;

  const tabButtons = () => [...(stripRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])];
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = tabButtons().indexOf(event.target as HTMLButtonElement);
    const last = tabs.length - 1;
    const next = ({ ArrowRight: at === last ? 0 : at + 1, ArrowLeft: at === 0 ? last : at - 1, Home: 0, End: last } as Record<string, number>)[event.key];
    if (at < 0 || (next === undefined && event.key !== "Delete")) return;
    event.preventDefault();
    if (next !== undefined) {
      tabButtons()[next]?.focus();
      onSelect(tabs[next]!.id);
      return;
    }
    onClose(tabs[at]!.id);
    // Once the host has re-rendered, keep focus on the tab it opened.
    requestAnimationFrame(() => (tabButtons().find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabButtons().at(-1))?.focus());
  };

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex h-10 min-w-0 items-end gap-1 overflow-x-auto px-2 shadow-[inset_0_-1px_0_hsl(var(--border))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const Icon = getTabIcon(tab.name);
        const [head, tail] = splitName(tab.name);

        return (
          <div
            key={tab.id}
            title={tab.path}
            className={cn(
              "group relative flex h-[calc(100%-0.375rem)] max-w-72 shrink-0 items-center rounded-t-lg border border-b-0 text-sm",
              controlMotion,
              isActive
                ? "border-border bg-card text-foreground"
                : "border-transparent text-muted-foreground hover:bg-[var(--ix-hover-bg)] hover:text-foreground",
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.dirty ? `${tab.name}, unsaved changes` : tab.name}
              tabIndex={isActive || (!activeId && tab === tabs[0]) ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={cn("flex h-full min-w-0 items-center gap-1.5 rounded-t-lg pl-3 pr-1", focusRingInset)}
            >
              <Icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0">
                <span className="overflow-hidden text-ellipsis whitespace-pre">{head}</span>
                {tail && <span className="shrink-0 whitespace-pre">{tail}</span>}
              </span>
              {tab.dirty && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--accent-text)]" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Close ${tab.name}`}
              onClick={() => onClose(tab.id)}
              className={cn(
                "mr-1.5 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-[var(--ix-hover-bg)] hover:text-foreground",
                controlMotion,
                !isActive && "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
              )}
            >
              <X aria-hidden className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
