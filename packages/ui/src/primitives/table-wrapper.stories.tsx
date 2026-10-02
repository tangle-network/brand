import type { Meta, StoryObj } from "@storybook/react";
import { focusRing } from "../lib/focus";
import { Heading } from "./heading";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, type TableProps } from "./table";

const meta = {
  title: "Primitives/Table/Wrapper",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

function WideTable(props: TableProps) {
  return <Table className="min-w-[40rem]" {...props}>
    <TableCaption>Build activity, including the full result identifier</TableCaption>
    <TableHeader><TableRow><TableHead scope="col">Item</TableHead><TableHead scope="col">Result</TableHead><TableHead scope="col">Updated</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableHead scope="row">Documentation build</TableHead><TableCell>result_012345678901234567890123456789</TableCell><TableCell>Just now</TableCell></TableRow></TableBody>
  </Table>;
}

const checkScrollOwner: NonNullable<Story["play"]> = ({ canvasElement }) => {
  const regions = canvasElement.querySelectorAll<HTMLElement>('[role="region"]');
  if (regions.length !== 1) throw new Error("Expected exactly one named scroll region");
  const region = regions[0]!;
  if (region.querySelector(".overflow-auto")) throw new Error("Table introduced a nested scroll container");
  if (region.scrollWidth <= region.clientWidth) throw new Error("Wide-table fixture does not overflow");
  region.focus();
  if (region.ownerDocument.activeElement !== region) throw new Error("Scroll owner is not focusable");
  region.scrollLeft = 24;
  if (region.scrollLeft <= 0) throw new Error("Named scroll region cannot scroll");
  region.scrollLeft = 0;
  if (!region.querySelector("table > caption") || !region.querySelector('table > thead th[scope="col"]')) {
    throw new Error("Native table semantics were lost");
  }
};

export const AccessibleOverflow: Story = {
  render: () => <div className="space-y-3" style={{ width: 320, maxWidth: "100%" }}>
    <Heading variant="section">All activity columns</Heading>
    <p className="text-sm text-muted-foreground">Tab to the named region and use the arrow keys to reveal the remaining columns.</p>
    <WideTable wrapperProps={{ role: "region", "aria-label": "Activity columns", tabIndex: 0, className: focusRing }} />
  </div>,
  play: checkScrollOwner,
};
export const CallerOwnedScroll: Story = {
  render: () => <div className="space-y-3" style={{ width: 320, maxWidth: "100%" }}>
    <Heading variant="section">Caller-owned scrolling</Heading>
    <div role="region" aria-label="Activity columns" tabIndex={0} className={`overflow-auto ${focusRing}`}>
      <WideTable wrapper={false} />
    </div>
  </div>,
  play: checkScrollOwner,
};
