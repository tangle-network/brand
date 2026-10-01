import type { Meta, StoryObj } from "@storybook/react";
import { OpenUIArtifactRenderer } from "./openui-artifact-renderer";

const meta: Meta<typeof OpenUIArtifactRenderer> = {
  title: "OpenUI/ArtifactRenderer",
  component: OpenUIArtifactRenderer,
  decorators: [(Story) => <div className="mx-auto max-w-2xl p-6"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof OpenUIArtifactRenderer>;

export const NestedCard: Story = {
  args: {
    schema: {
      type: "card",
      title: "Release proof",
      children: [
        { type: "heading", text: "Result" },
        { type: "stack", children: [
          { type: "stat", label: "Checks", value: "3" },
          { type: "text", text: "The saved result remains visible after reload." },
        ] },
      ],
    },
  },
};

export const UnsupportedSavedNode: Story = {
  args: {
    schema: {
      type: "card",
      children: [{ type: "section", children: [{ type: "text", text: "This content must not disappear silently." }] }],
    } as never,
  },
};
