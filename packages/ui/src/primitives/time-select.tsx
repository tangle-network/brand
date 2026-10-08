"use client";

import * as React from "react";
import type { ControlSize } from "../lib/control-presentation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface TimeSelectProps {
  /** `HH:MM`, 24-hour, the value a native time input reports. */
  value?: string;
  onChange?: (value: string) => void;
  /** Minutes between choices. Default 15. */
  step?: number;
  placeholder?: string;
  size?: ControlSize;
  disabled?: boolean;
  locale?: string;
  id?: string;
  name?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/**
 * A time of day as a Select on the control scale: the day in `step`-minute
 * slots, labelled in the viewer's locale (9:30 AM, 21:30). A value between
 * slots stays listed so the current time is never lost.
 */
const TimeSelect = React.forwardRef<HTMLButtonElement, TimeSelectProps>(
  ({ value, onChange, step = 15, placeholder = "Pick a time", size = "md", disabled, locale, id, name, className, ...aria }, ref) => {
    const format = React.useMemo(
      () => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }),
      [locale],
    );
    const options = React.useMemo(() => {
      const values: string[] = [];
      for (let minutes = 0; minutes < 24 * 60; minutes += Math.max(1, step)) {
        values.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
      }
      if (value && TIME_PATTERN.test(value) && !values.includes(value)) values.push(value);
      return values.sort();
    }, [step, value]);
    const label = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return format.format(Date.UTC(1970, 0, 1, hours, minutes));
    };

    return (
      <Select value={value && TIME_PATTERN.test(value) ? value : undefined} onValueChange={onChange} disabled={disabled} name={name}>
        <SelectTrigger ref={ref} id={id} size={size} className={className} {...aria}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((time) => (
            <SelectItem key={time} value={time}>{label(time)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
);
TimeSelect.displayName = "TimeSelect";

export { TimeSelect };
