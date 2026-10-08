import * as React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { controlHeight } from "../lib/control-presentation";
import { Button } from "./button";
import { Calendar, formatCalendarDate, parseCalendarDate } from "./calendar";
import { DatePicker } from "./date-picker";
import { Select, SelectTrigger, SelectValue } from "./select";
import { TimeSelect } from "./time-select";
import { FilterField, Toolbar } from "./toolbar";

afterEach(cleanup);

describe("calendar dates", () => {
  it("round-trips YYYY-MM-DD in UTC and rejects impossible dates", () => {
    const time = parseCalendarDate("2026-03-08");
    expect(time).toBe(Date.UTC(2026, 2, 8));
    expect(formatCalendarDate(time!)).toBe("2026-03-08");
    expect(parseCalendarDate("2026-02-31")).toBeNull();
    expect(parseCalendarDate("03/08/2026")).toBeNull();
  });
});

describe("Calendar", () => {
  it("renders six weeks, marks today and the selection, and picks a day", async () => {
    const onChange = vi.fn();
    render(<Calendar value="2026-10-08" today="2026-10-08" onChange={onChange} locale="en-US" />);
    const grid = screen.getByRole("grid", { name: "October 2026" });
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(42);
    const selected = screen.getByRole("button", { name: "Thursday, October 8, 2026" });
    expect(selected).toHaveAttribute("aria-current", "date");
    expect(selected.closest("[role=gridcell]")).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("button", { name: "Friday, October 16, 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-16");
  });

  it("moves by day, week and month from the keyboard and picks with Enter", async () => {
    const onChange = vi.fn();
    render(<Calendar value="2026-10-31" onChange={onChange} locale="en-US" />);
    const user = userEvent.setup();
    screen.getByRole("button", { name: "Saturday, October 31, 2026" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeTruthy();
    expect(document.activeElement).toHaveAccessibleName("Sunday, November 1, 2026");
    await user.keyboard("{ArrowDown}{PageUp}");
    expect(document.activeElement).toHaveAccessibleName("Thursday, October 8, 2026");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("2026-10-08");
  });

  it("refuses dates outside min and max", async () => {
    const onChange = vi.fn();
    render(<Calendar defaultMonth="2026-10-01" min="2026-10-10" onChange={onChange} locale="en-US" />);
    const early = screen.getByRole("button", { name: "Friday, October 9, 2026" });
    expect(early).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(early);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("starts weeks on Monday when asked", () => {
    render(<Calendar defaultMonth="2026-10-01" weekStartsOn={1} locale="en-US" />);
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Monday");
  });
});

describe("DatePicker", () => {
  it("shows the date in the locale instead of a mm/dd/yyyy mask, on the control scale", () => {
    render(<DatePicker aria-label="Schedule for" value="2026-10-08" locale="en-US" />);
    const trigger = screen.getByRole("button", { name: "Schedule for" });
    expect(trigger).toHaveTextContent("Oct 8, 2026");
    expect(trigger.className.split(" ")).toContain(controlHeight.md);
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens a calendar, reports the chosen date and closes", async () => {
    const onChange = vi.fn();
    render(<DatePicker aria-label="Schedule for" placeholder="Any date" defaultMonth="2026-10-01" onChange={onChange} locale="en-US" />);
    const trigger = screen.getByRole("button", { name: "Schedule for" });
    expect(trigger).toHaveTextContent("Any date");
    expect(trigger).toHaveAttribute("data-placeholder");
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole("button", { name: "Tuesday, October 20, 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-20");
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("clears a chosen date and submits it with a name", async () => {
    const onChange = vi.fn();
    const { container } = render(<DatePicker aria-label="Due" name="due" value="2026-10-08" onChange={onChange} locale="en-US" />);
    expect(container.querySelector('input[type="hidden"][name="due"]')).toHaveValue("2026-10-08");
    await userEvent.click(screen.getByRole("button", { name: "Due" }));
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("TimeSelect", () => {
  it("lists step slots in the locale and keeps an off-step value", () => {
    render(<TimeSelect aria-label="Time" value="09:07" locale="en-US" step={30} />);
    const trigger = screen.getByRole("combobox", { name: "Time" });
    expect(trigger).toHaveTextContent("9:07 AM");
    expect(trigger.className.split(" ")).toContain(controlHeight.md);
  });

  it("reports HH:MM when a slot is picked", async () => {
    // jsdom lacks the layout APIs Radix Select calls while opening.
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
    Element.prototype.releasePointerCapture ??= vi.fn();
    const onChange = vi.fn();
    render(<TimeSelect aria-label="Time" value="09:00" onChange={onChange} locale="en-US" step={60} />);
    const trigger = screen.getByRole("combobox", { name: "Time" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(await screen.findByRole("option", { name: "10:00 AM" }));
    expect(onChange).toHaveBeenCalledWith("10:00");
  });
});

describe("raised fields in a Toolbar", () => {
  it("lifts fields inside a Toolbar onto the card surface and leaves others in the well", () => {
    render(
      <>
        <Toolbar data-testid="toolbar" filters={<FilterField label="Format"><Select><SelectTrigger aria-label="Format"><SelectValue /></SelectTrigger></Select></FilterField>} />
        <Select><SelectTrigger aria-label="Elsewhere"><SelectValue /></SelectTrigger></Select>
      </>,
    );
    expect(screen.getByTestId("toolbar").className).toContain("[--field-surface:hsl(var(--card))]");
    for (const name of ["Format", "Elsewhere"]) {
      expect(screen.getByRole("combobox", { name }).className).toContain("bg-[var(--field-surface,var(--bg-input))]");
    }
  });
});

describe("Button bare", () => {
  it("keeps focus and disabled behavior without surface or size classes", () => {
    render(<Button variant="bare" className="flex w-full px-4 py-2" disabled>Row</Button>);
    const row = screen.getByRole("button", { name: "Row" });
    expect(row).toBeDisabled();
    expect(row.className).toContain("focus-visible:ring-4");
    expect(row.className).not.toContain("h-[var(--control-height");
    expect(row.className).not.toContain("inline-flex");
    expect(row.className).toContain("px-4");
  });
});
