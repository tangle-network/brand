import type { Meta, StoryObj } from "@storybook/react";
import { RunPhaseList } from "./run-phase-list";

const meta: Meta<typeof RunPhaseList> = {
  title: "Run/RunPhaseList",
  component: RunPhaseList,
  parameters: { layout: "padded" },
};
export default meta;

export const Phases: StoryObj<typeof RunPhaseList> = {
  args: {
    phases: [
      { id: "find", title: "Find the hero source", summary: "Read 12 files · searched 3 times", status: "done", content: <p>12 reads</p> },
      { id: "patch", title: "Patch the layout", summary: "2 edits", status: "error", content: <p>An edit failed</p> },
      { id: "prove", title: "Prove it on a phone", summary: "Running the browser", status: "running", content: <p>Chromium at 390</p> },
    ],
  },
};
