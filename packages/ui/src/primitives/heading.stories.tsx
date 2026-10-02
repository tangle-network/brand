import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./heading";

const meta = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  args: { variant: "page", children: "Activity across your workspace" },
  argTypes: {
    variant: { control: "select", options: ["display", "hero", "page", "section", "subsection", "eyebrow"] },
    as: { control: "select", options: ["h1", "h2", "h3", "h4", "h5", "h6", "p"] },
  },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const IndependentSemantics: Story = {
  args: { variant: "page", as: "h2", children: "Page-sized title in a nested surface" },
};
export const Hierarchy: Story = {
  render: () => <main className="space-y-6">
    <Heading variant="eyebrow">Workspace</Heading>
    <Heading variant="page">Activity</Heading>
    <section className="space-y-4">
      <Heading variant="section">Recent items</Heading>
      <Heading variant="subsection">Build details</Heading>
      <p className="text-muted-foreground">Eyebrows are labels, not extra headings.</p>
    </section>
  </main>,
  play: ({ canvasElement }) => {
    const tags = Array.from(canvasElement.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((node) => node.tagName).join(",");
    if (tags !== "H1,H2,H3") throw new Error(`Unexpected heading hierarchy: ${tags}`);
  },
};
