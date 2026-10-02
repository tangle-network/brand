import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Heading } from "./heading";

const meta = {
  title: "Primitives/Card/Anatomy",
  component: Card,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AlignedParts: Story = {
  render: () => <div className="max-w-lg space-y-6">
    <Heading variant="page">Activity details</Heading>
    <Card data-anatomy="full">
      <CardHeader data-part="header"><CardTitle as="h2">Latest result</CardTitle><CardDescription>One heading level below the page.</CardDescription></CardHeader>
      <CardContent data-part="content">The header, body and footer share one horizontal gutter.</CardContent>
      <CardFooter data-part="footer"><Button type="button" variant="outline">View result</Button></CardFooter>
    </Card>
    <Card data-anatomy="standalone"><CardContent data-part="content">Content-only cards retain their top padding.</CardContent></Card>
  </div>,
  play: ({ canvasElement }) => {
    const parts = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-anatomy="full"] > [data-part]'));
    const styles = parts.map((part) => getComputedStyle(part));
    const gutter = styles[0]?.paddingLeft;
    if (!gutter || parseFloat(gutter) <= 0 || styles.some((style) => style.paddingLeft !== gutter || style.paddingRight !== gutter)) {
      throw new Error("Card parts do not share a nonzero horizontal gutter");
    }
    if (parseFloat(styles[1]!.paddingTop) !== 0 || parseFloat(styles[2]!.paddingTop) !== 0) {
      throw new Error("Stacked card parts duplicate top padding");
    }
    const standalone = canvasElement.querySelector<HTMLElement>('[data-anatomy="standalone"] > [data-part]')!;
    const style = getComputedStyle(standalone);
    if (parseFloat(style.paddingTop) <= 0 || style.paddingTop !== style.paddingBottom) {
      throw new Error("Content-only card lost its top padding");
    }
  },
};

function ActionCard() {
  const [count, setCount] = useState(0);
  return <Card hover className="max-w-sm">
    <CardHeader><CardTitle as="h2">Decorative hover, native action</CardTitle><CardDescription>Tab to the button; Enter and Space both work.</CardDescription></CardHeader>
    <CardContent><p role="status">Opened {count} times</p></CardContent>
    <CardFooter><Button type="button" onClick={() => setCount((value) => value + 1)}>Open details</Button></CardFooter>
  </Card>;
}
export const KeyboardAction: Story = { render: () => <ActionCard /> };
