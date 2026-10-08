"use client";

import { CalendarDays } from "lucide-react";
import * as React from "react";
import { fieldPresentation, fieldSizes, fieldTouchText, type ControlSize } from "../lib/control-presentation";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Calendar, parseCalendarDate, type CalendarDate, type CalendarProps } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps
  extends Pick<CalendarProps, "min" | "max" | "isDateDisabled" | "today" | "weekStartsOn" | "locale" | "defaultMonth"> {
  /** The chosen date, `YYYY-MM-DD`, or empty for none. */
  value?: CalendarDate | null;
  onChange?: (value: CalendarDate | "") => void;
  /** Shown when no date is chosen. */
  placeholder?: string;
  size?: ControlSize;
  disabled?: boolean;
  /** Offer a Clear action while a date is chosen. Default true. */
  clearable?: boolean;
  /** How the chosen date reads on the trigger. */
  formatOptions?: Intl.DateTimeFormatOptions;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

/**
 * A date field: a trigger on the control scale that opens a Calendar. It reads
 * like a Select (same height, well, border, focus ring), shows the date in the
 * viewer's locale instead of a `mm/dd/yyyy` mask, and reports `YYYY-MM-DD`.
 * With `name` it also submits that value in a form.
 */
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = "Pick a date",
      size = "md",
      disabled,
      clearable = true,
      formatOptions = DEFAULT_FORMAT,
      id,
      name,
      className,
      locale,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...calendarProps
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const selected = parseCalendarDate(value);
    const label = selected === null
      ? null
      : new Intl.DateTimeFormat(locale, { ...formatOptions, timeZone: "UTC" }).format(selected);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            id={id}
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            aria-haspopup="dialog"
            data-placeholder={selected === null ? "" : undefined}
            className={cn(
              "inline-flex w-full items-center justify-between gap-2 whitespace-nowrap border py-1 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-50",
              fieldPresentation,
              fieldTouchText,
              fieldSizes[size],
              "data-[placeholder]:text-[var(--text-dim)] data-[state=open]:border-primary",
              className,
            )}
          >
            <span className="min-w-0 truncate">{label ?? placeholder}</span>
            <CalendarDays aria-hidden className="size-4 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        {name && <input type="hidden" name={name} value={selected === null ? "" : (value as string)} />}
        <PopoverContent align="start" className="w-auto p-3">
          <Calendar
            {...calendarProps}
            locale={locale}
            value={value}
            onChange={(next) => {
              onChange?.(next);
              setOpen(false);
            }}
          />
          {clearable && selected !== null && (
            <div className="mt-2 flex justify-end border-t border-border pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  },
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
