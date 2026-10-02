import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { PageHeader } from "./page-header";
import { StatusPill } from "./status-pill";

const meta = {
  title: "Primitives/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
  args: {
    title: "Activity",
    description: "Inspect recent work and the scope of the results below.",
    actions: <Button type="button">Export</Button>,
    meta: <><span>12 results · Last 24 hours</span><StatusPill tone="success">Up to date</StatusPill></>,
  },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Nested: Story = { args: { level: 2 } };
export const SandboxInputs: Story = {
  args: { actions: undefined, action: <Button type="button">Create item</Button>, eyebrow: "Workspace", titleAs: "h2" },
};
export const NarrowLongContent: Story = {
  render: () => <div data-narrow-header style={{ width: 320, maxWidth: "100%" }}>
    <PageHeader
      title="Production activity for workspace-with-a-very-long-unbroken-identifier-012345678901234567890123456789"
      description="Inspect the selected activity without clipping the title or hiding action names."
      eyebrow="Production workspace"
      titleId="long-page-title"
      actions={<>
        <Button type="button" className="h-auto whitespace-normal">Export all selected activity for this workspace</Button>
        <Button type="button" variant="outline" className="h-auto whitespace-normal">Create another activity item</Button>
      </>}
      meta={<><span>0 matching results</span><StatusPill tone="neutral">No filter matches</StatusPill></>}
    />
  </div>,
  // Executes when this story is opened in a real browser. Building Storybook
  // alone does not run this layout assertion.
  play: async ({ canvasElement }) => {
    await canvasElement.ownerDocument.fonts.ready;
    const root = canvasElement.querySelector<HTMLElement>("[data-narrow-header]")!;
    if (root.scrollWidth > root.clientWidth + 1) throw new Error("PageHeader overflows its narrow container");
    for (const button of root.querySelectorAll("button")) {
      if (button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1) {
        throw new Error("A long action label is clipped");
      }
    }
  },
};
