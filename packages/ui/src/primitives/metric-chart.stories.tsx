import type { Meta, StoryObj } from "@storybook/react";
import { MetricChart } from "./metric-chart";

const meta = {
  title: "Primitives/MetricChart",
  component: MetricChart,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MetricChart>;
export default meta;
type Story = StoryObj<typeof meta>;

const DAY = 86_400_000;
const t0 = Date.parse("2026-08-24T07:00:00.000Z");

const bloodPressure = Array.from({ length: 12 }, (_, index) => ({
  at: t0 + index * 5 * DAY,
  value: 118 + ((index * 7) % 9),
  value2: 74 + ((index * 5) % 8),
}));

const steps = Array.from({ length: 12 }, (_, index) => ({
  at: t0 + index * 5 * DAY,
  value: 6_200 + ((index * 1_937) % 4_800),
}));

export const DualSeries: Story = {
  args: {
    title: "Blood pressure",
    unit: "mmHg",
    decimals: 0,
    points: bloodPressure,
    referenceLines: [
      { value: 120, label: "120 systolic" },
      { value: 80, label: "80 diastolic", series: "secondary" },
    ],
  },
};

export const SingleSeries: Story = {
  args: {
    title: "Steps",
    unit: "steps",
    decimals: 0,
    points: steps,
  },
};

export const SingleReading: Story = {
  args: {
    title: "Weight",
    unit: "kg",
    decimals: 1,
    points: [{ at: t0, value: 71.4 }],
  },
};
