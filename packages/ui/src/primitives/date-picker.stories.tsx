import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { DatePicker } from "./date-picker";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { TimeSelect } from "./time-select";
import { FilterField, Toolbar } from "./toolbar";

function FilterBar() {
  const [date, setDate] = React.useState("");
  const [format, setFormat] = React.useState("all");
  const [time, setTime] = React.useState("09:30");
  return (
    <main className="space-y-8 bg-background p-6 text-foreground" data-date-picker-story>
      <section>
        <h2 className="mb-3 font-semibold text-section">On the page canvas, in a Toolbar</h2>
        <Toolbar
          search={<Input aria-label="Filter assets" placeholder="Filter assets…" />}
          filters={<>
            <FilterField label="Format" htmlFor="format">
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format" className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All formats</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Schedule for" htmlFor="schedule">
              <DatePicker id="schedule" className="w-40" placeholder="Any date" value={date} onChange={setDate} />
            </FilterField>
            <FilterField label="At" htmlFor="at">
              <TimeSelect id="at" className="w-32" value={time} onChange={setTime} />
            </FilterField>
          </>}
          actions={<Button variant="outline">Approve all (4)</Button>}
        />
      </section>
      <section className="max-w-sm space-y-2 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-section">In a card, in the field well</h2>
        <DatePicker aria-label="Due" value="2026-10-08" />
      </section>
      <section className="w-fit rounded-xl border border-border bg-card p-3">
        <Calendar value="2026-10-08" today="2026-10-08" weekStartsOn={1} />
      </section>
    </main>
  );
}

const meta = { title: "Primitives/Date Picker", component: FilterBar, parameters: { layout: "fullscreen" } } satisfies Meta<typeof FilterBar>;
export default meta;
export const InAToolbar: StoryObj<typeof meta> = {};
