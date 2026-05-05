import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "./logo";

const meta: Meta<typeof Logo> = {
  title: "Brand/Logo",
  component: Logo,
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
    variant: { control: "select", options: ["full", "icon"] },
    suffix: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Full: Story = { args: { variant: "full", size: "md" } };
export const Icon: Story = { args: { variant: "icon", size: "md" } };
export const WithSuffix: Story = { args: { variant: "full", size: "lg", suffix: "Sandbox" } };
