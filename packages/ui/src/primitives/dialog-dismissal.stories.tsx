import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";

const meta = {
  title: "Primitives/Dialog/Dismissal",
  component: DialogContent,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DialogContent>;
export default meta;
type Story = StoryObj<typeof meta>;

function ExplicitChoiceExample() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState("No choice recorded.");
  const finish = (value: string) => {
    setChoice(value);
    setOpen(false);
  };
  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button>Review operation</Button></DialogTrigger>
        <DialogContent
          hideCloseButton
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Continue this operation?</DialogTitle>
            <DialogDescription>
              This example requires an explicit choice. Hiding the close button
              alone does not block Escape or outside dismissal; these handlers do.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => finish("Cancelled in this example.")}>Cancel</Button>
            <Button onClick={() => finish("Confirmed in this example.")}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <output className="block text-sm text-muted-foreground" aria-live="polite">{choice}</output>
    </div>
  );
}

export const ExplicitChoice: Story = { render: () => <ExplicitChoiceExample /> };
