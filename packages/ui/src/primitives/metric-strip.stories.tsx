import type { Meta, StoryObj } from "@storybook/react";
import { Metric, MetricStrip } from "./metric-strip";

const meta = {
  title: "Primitives/MetricStrip",
  component: MetricStrip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MetricStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

const readings = [
  { label: "Available balance · project wallet", value: "$1,284,003.10", hint: "This account only; not the organization total" },
  { label: "Calls", value: 0, hint: "Known zero" },
  { label: "Pending amount", value: "—", hint: "Not yet available" },
  { label: "Average cost / call", value: "$0.000123", hint: "Current window" },
  { label: "LongUnbrokenAccountIdentity1234567890", value: "12345678901234567890", hint: 0 },
  { label: "Errors requiring review", value: 0, hint: "No inferred warning" },
];

export const Default: Story = {
  args: { children: readings.slice(0, 4).map((reading) => <Metric key={reading.label} {...reading} />) },
};

export const ThreeToSix: Story = {
  args: { children: null },
  render: () => (
    <div className="space-y-6">
      {([3, 4, 5, 6] as const).map((columns) => (
        <section key={columns} className="space-y-2">
          <h2 className="text-lg font-semibold">{columns} metrics</h2>
          <MetricStrip columns={columns} aria-label={`${columns} metrics`}>
            {readings.slice(0, columns).map((reading) => <Metric key={reading.label} {...reading} />)}
          </MetricStrip>
        </section>
      ))}
    </div>
  ),
};
