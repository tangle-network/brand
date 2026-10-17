import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Wizard } from "./wizard";

const meta: Meta<typeof Wizard> = {
  title: "Primitives/Wizard",
  component: Wizard,
};
export default meta;

/** The intended shape: linear steps, one primary action each, async gate in the middle. */
export const ConnectNumber: StoryObj<typeof Wizard> = {
  render: () => (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6">
      <Wizard onFinished={() => alert("connected")}>
        <Wizard.Step title="Number" nextLabel="Continue">
          <label className="grid gap-2 text-sm">
            Your business number
            <Input placeholder="+1 618 297 8214" />
          </label>
        </Wizard.Step>
        <Wizard.Step title="Verify" nextLabel="I replied" onNext={() => new Promise(resolve => setTimeout(resolve, 800))}>
          <p className="text-sm text-muted-foreground">
            We sent a code to your phone. Reply to the message, then continue.
          </p>
        </Wizard.Step>
        <Wizard.Step title="Done" nextLabel="Finish">
          <p className="text-sm">Your number is live. Guests can text it now.</p>
        </Wizard.Step>
      </Wizard>
    </div>
  ),
};

/** A step whose content owns the actions entirely: no footer, no default chrome. */
export const CustomActions: StoryObj<typeof Wizard> = {
  render: () => (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6">
      <Wizard>
        <Wizard.Step title="Choice">
          <div className="grid gap-3">
            <Button onClick={() => undefined}>Use my own number</Button>
            <Button variant="outline" onClick={() => undefined}>Give me a Tangle number</Button>
          </div>
        </Wizard.Step>
      </Wizard>
    </div>
  ),
};
