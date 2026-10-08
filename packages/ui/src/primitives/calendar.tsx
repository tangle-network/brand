"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";
import { Button } from "./button";

/**
 * Calendar dates are plain `YYYY-MM-DD` strings, the same value a native date
 * input reports. All arithmetic runs in UTC so a date never shifts with the
 * viewer's time zone or a daylight-saving boundary.
 */
export type CalendarDate = string;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function parseCalendarDate(value: string | null | undefined): number | null {
  const match = value ? DATE_PATTERN.exec(value) : null;
  if (!match) return null;
  const time = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(time);
  // Reject impossible dates such as 2026-02-31 rather than rolling them over.
  return date.getUTCMonth() === Number(match[2]) - 1 ? time : null;
}

export function formatCalendarDate(time: number): CalendarDate {
  const date = new Date(time);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/** Today in the viewer's local calendar, as a `YYYY-MM-DD` string. */
export function localToday(now = new Date()): CalendarDate {
  return formatCalendarDate(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function firstOfMonth(time: number): number {
  const date = new Date(time);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function addMonths(time: number, delta: number): number {
  const date = new Date(time);
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDay);
  return target + (day - 1) * DAY_MS;
}

export interface CalendarProps {
  /** The selected date, `YYYY-MM-DD`. */
  value?: CalendarDate | null;
  onChange?: (value: CalendarDate) => void;
  /** The month shown first (any date inside it). Defaults to the value, else today. */
  defaultMonth?: CalendarDate;
  /** Earliest and latest selectable dates, inclusive. */
  min?: CalendarDate;
  max?: CalendarDate;
  isDateDisabled?: (value: CalendarDate) => boolean;
  /** The date marked as today. Pass it to use a workspace time zone instead of the viewer's. */
  today?: CalendarDate;
  /** 0 starts weeks on Sunday, 1 on Monday. */
  weekStartsOn?: 0 | 1;
  locale?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * A month grid that picks one date. Arrow keys move by day and week, Page Up
 * and Page Down by month, Home and End to the week's ends; Enter or Space picks
 * the focused date. Six weeks always render so the grid never changes height.
 */
const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      value,
      onChange,
      defaultMonth,
      min,
      max,
      isDateDisabled,
      today: todayProp,
      weekStartsOn = 0,
      locale,
      className,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const today = parseCalendarDate(todayProp) ?? (parseCalendarDate(localToday()) as number);
    const selected = parseCalendarDate(value);
    const minTime = parseCalendarDate(min);
    const maxTime = parseCalendarDate(max);
    const [focused, setFocused] = React.useState<number>(
      () => selected ?? parseCalendarDate(defaultMonth) ?? today,
    );
    const viewMonth = firstOfMonth(focused);
    const gridRef = React.useRef<HTMLDivElement>(null);
    const moveFocusRef = React.useRef(false);

    React.useEffect(() => {
      if (selected !== null) setFocused(selected);
    }, [selected]);

    React.useEffect(() => {
      if (!moveFocusRef.current) return;
      moveFocusRef.current = false;
      gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
    }, [focused]);

    const disabled = (time: number) =>
      (minTime !== null && time < minTime) ||
      (maxTime !== null && time > maxTime) ||
      Boolean(isDateDisabled?.(formatCalendarDate(time)));

    const leading = (new Date(viewMonth).getUTCDay() - weekStartsOn + 7) % 7;
    const start = viewMonth - leading * DAY_MS;
    const days = Array.from({ length: 42 }, (_, index) => start + index * DAY_MS);
    const weeks = Array.from({ length: 6 }, (_, row) => days.slice(row * 7, row * 7 + 7));

    const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(viewMonth);
    const dayLabel = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
    const weekdays = days.slice(0, 7);

    const move = (next: number) => {
      moveFocusRef.current = true;
      setFocused(next);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
      const weekday = (new Date(focused).getUTCDay() - weekStartsOn + 7) % 7;
      const steps: Record<string, () => number> = {
        ArrowLeft: () => focused - DAY_MS,
        ArrowRight: () => focused + DAY_MS,
        ArrowUp: () => focused - 7 * DAY_MS,
        ArrowDown: () => focused + 7 * DAY_MS,
        PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
        PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
        Home: () => focused - weekday * DAY_MS,
        End: () => focused + (6 - weekday) * DAY_MS,
      };
      const step = steps[event.key];
      if (!step) return;
      event.preventDefault();
      move(step());
    };

    const pick = (time: number) => {
      if (disabled(time)) return;
      setFocused(time);
      onChange?.(formatCalendarDate(time));
    };

    return (
      <div ref={ref} className={cn("w-fit select-none", className)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setFocused(addMonths(focused, -1))}
          >
            <ChevronLeft />
          </Button>
          <div aria-live="polite" className="font-medium text-[length:var(--control-text-md,0.875rem)] text-foreground">
            {monthLabel}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setFocused(addMonths(focused, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <div ref={gridRef} role="grid" aria-label={ariaLabel ?? monthLabel} onKeyDown={onKeyDown}>
          <div role="row" className="grid grid-cols-7">
            {weekdays.map((time) => (
              <div
                key={time}
                role="columnheader"
                aria-label={weekdayLong.format(time)}
                className="flex h-8 items-center justify-center text-[length:var(--font-size-help,0.75rem)] text-muted-foreground"
              >
                {weekdayShort.format(time).slice(0, 2)}
              </div>
            ))}
          </div>
          {weeks.map((week) => (
            <div key={week[0]} role="row" className="grid grid-cols-7">
              {week.map((time) => {
                const outside = firstOfMonth(time) !== viewMonth;
                const isSelected = selected === time;
                const isToday = today === time;
                const isDisabled = disabled(time);
                return (
                  <div key={time} role="gridcell" aria-selected={isSelected}>
                    <button
                      type="button"
                      tabIndex={time === focused ? 0 : -1}
                      data-focused={time === focused}
                      data-outside={outside || undefined}
                      data-today={isToday || undefined}
                      aria-label={dayLabel.format(time)}
                      aria-current={isToday ? "date" : undefined}
                      aria-disabled={isDisabled || undefined}
                      onClick={() => pick(time)}
                      onFocus={() => { if (time !== focused) setFocused(time); }}
                      className={cn(
                        "flex size-[var(--control-height,2.25rem)] items-center justify-center rounded-lg text-[length:var(--control-text-md,0.875rem)] tabular-nums transition-colors",
                        focusRing,
                        "hover:bg-muted",
                        outside && "text-muted-foreground/60",
                        isToday && !isSelected && "font-semibold text-[var(--accent-text)]",
                        isSelected && "bg-primary font-medium text-primary-foreground hover:bg-primary/90",
                        isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
                      )}
                    >
                      {new Date(time).getUTCDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
Calendar.displayName = "Calendar";

export { Calendar };
