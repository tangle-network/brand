import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { HelpText } from "./help-text";
import { Input, Textarea } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Metric, MetricStrip } from "./metric-strip";

function Contract() {
  const [actions, setActions] = React.useState(0);
  const [choice, setChoice] = React.useState("one");
  return (
    <main className="mx-auto max-w-5xl space-y-6 bg-background p-4 text-foreground" data-presentation-contract>
      <h1 className="text-xl font-semibold">Field and metric presentation</h1>
      {(["sm", "md", "lg", "compact", "touch"] as const).map((size) => (
        <section key={size} data-size-row={size} className="space-y-2">
          <h2 className="font-semibold">{size}</h2>
          <div className="flex flex-wrap items-end gap-3">
            <Input size={size} aria-label={`${size} field`} placeholder="Project name" className="w-48 max-w-full" />
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger size={size} aria-label={`${size} choice`} className="w-48 max-w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one">First account</SelectItem>
                <SelectItem value="two">Second account with a descriptive long name</SelectItem>
              </SelectContent>
            </Select>
            <Button size={size} onClick={() => setActions((value) => value + 1)}>Save</Button>
            <Button size={size} variant="outline">Cancel</Button>
          </div>
          <Textarea size={size} aria-label={`${size} notes`} placeholder="Details" />
        </section>
      ))}
      <section className="max-w-sm space-y-1.5" data-form-text>
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input id="workspace-name" aria-describedby="workspace-name-hint" placeholder="Acme" />
        <HelpText id="workspace-name-hint">Shown to everyone you invite.</HelpText>
        <HelpText tone="error">This name is already taken.</HelpText>
      </section>
      <section className="space-y-2" data-state-controls>
        <h2 className="font-semibold">States and actions</h2>
        <Input label="Email" autoComplete="email" name="email" defaultValue="reader@example.test" />
        <Input label="Invalid field" hint="The hint remains available" error="Please correct this value" defaultValue="invalid" />
        <Input label="Disabled field" disabled defaultValue="Unavailable" />
        <div className="flex flex-wrap gap-3">
          <Button loading data-pending>Publish</Button>
          <Button disabled>Disabled action</Button>
          <Button variant="link" data-link-action onClick={() => setActions((value) => value + 1)}>Review details</Button>
          <Button asChild loading><a href="#unavailable" data-pending-link>Pending link</a></Button>
          <Button size="touch" className="h-auto max-w-full whitespace-normal" data-long-action onClick={() => setActions((value) => value + 1)}>Save changes and return to the organization workspace</Button>
        </div>
        <output data-action-count>{actions}</output>
        <output data-choice>{choice}</output>
      </section>
      <section data-density style={{ "--control-height": "32px" } as React.CSSProperties} className="flex flex-wrap gap-3">
        <Input size="compact" aria-label="Dense field" className="w-48" />
        <Select><SelectTrigger size="compact" aria-label="Dense choice" className="w-48"><SelectValue placeholder="Choose" /></SelectTrigger></Select>
        <Button size="compact">Dense action</Button>
        <Button size="touch">Touch action</Button>
      </section>
      <section data-theme="light" className="space-y-3 rounded-lg bg-card p-4 text-foreground" data-scope="light">
        <Input aria-label="Light island" defaultValue="Light ink and well" />
        <div data-theme="dark" className="space-y-3 rounded-lg bg-card p-4 text-foreground" data-scope="dark">
          <Input aria-label="Dark island" defaultValue="Nested dark ink and well" />
          <div data-theme="aubergine-light" className="rounded-lg bg-card p-4 text-foreground" data-scope="named-light">
            <Input aria-label="Named island" defaultValue="Nested named light well" />
          </div>
        </div>
      </section>
      {([3, 4, 5, 6] as const).map((columns) => (
        <MetricStrip key={columns} columns={columns} data-columns={columns}>
          {Array.from({ length: columns }, (_, i) => <Metric key={i}
            label={i === 0 ? "Available balance · Organization operations wallet" : `Metric ${i}`}
            value={i === 0 ? "$1,284,003.10" : i === 1 ? 0 : i === 2 ? "—" : "12345678901234567890"}
            hint={i === 0 ? "LongUnbrokenAccountIdentity12345678901234567890" : i === 1 ? 0 : "Current window"} />)}
        </MetricStrip>
      ))}
      <MetricStrip data-legacy-summary className="sm:grid-cols-3">
        <Metric className="max-sm:col-span-2 max-sm:border-b" label="Total spent" value="$123.45" />
        <Metric className="max-sm:border-l-0!" label="Calls" value={0} />
        <Metric className="max-sm:border-l!" label="Average" value="$0.000000" />
      </MetricStrip>
    </main>
  );
}
const meta = { title: "Primitives/Control Presentation", component: Contract, parameters: { layout: "fullscreen" } } satisfies Meta<typeof Contract>;
export default meta;
export const Presentation: StoryObj<typeof meta> = {};
