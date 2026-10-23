import type { Meta, StoryObj } from "@storybook/react";
import { SeriesSparkline } from "./series-sparkline";

const meta = {
  title: "Primitives/SeriesSparkline",
  component: SeriesSparkline,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SeriesSparkline>;
export default meta;
type Story = StoryObj<typeof meta>;

const DAY = 86_400_000;
const t0 = Date.parse("2026-09-22T07:00:00.000Z");
const readings = [63, 61, 64, 60, 62, 65, 61, 63, 59, 62, 60, 61];

export const Default: Story = {
  args: {
    label: "Resting heart rate, last twelve readings",
    points: readings.map((value, index) => ({ at: t0 + index * DAY, value })),
  },
  render: (args) => (
    <div className="w-40">
      <SeriesSparkline {...args} />
    </div>
  ),
};

export const SingleReading: Story = {
  args: {
    label: "Weight, single reading",
    points: [{ at: t0, value: 71.4 }],
  },
  render: (args) => (
    <div className="w-40">
      <SeriesSparkline {...args} />
    </div>
  ),
};
