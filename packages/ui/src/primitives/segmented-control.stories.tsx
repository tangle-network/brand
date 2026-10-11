import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"
import { SegmentedControl, type SegmentedControlOption } from "./segmented-control"

const meta: Meta = {
  title: "Primitives/SegmentedControl",
  parameters: { layout: "fullscreen" },
}

export default meta
type Story = StoryObj

const workTabs: SegmentedControlOption[] = [
  { value: "today", label: "Today" },
  { value: "messages", label: "Messages" },
  { value: "tasks", label: "Tasks" },
  { value: "operations", label: "Operations" },
  { value: "payments", label: "Payments" },
  { value: "approvals", label: "Approvals" },
  { value: "activity", label: "Activity" },
  { value: "people", label: "People" },
]

const fileSources: SegmentedControlOption[] = [
  { value: "knowledge", label: "Knowledge" },
  { value: "attachments", label: "Attachments" },
  { value: "apps", label: "Apps & chats" },
]

function Controlled({
  initial,
  render,
}: {
  initial: string
  render: (value: string, setValue: (value: string) => void) => React.ReactNode
}) {
  const [value, setValue] = React.useState(initial)
  return <>{render(value, setValue)}</>
}

/**
 * Eight section tabs on a 390 px phone, as a workspace header renders them:
 * full width with the page's 16 px inline padding on the strip itself. Most
 * tabs sit past the right edge, the selected one starts off screen, and the
 * cut lands in the gap between two tabs, so only a chevron shows that the strip
 * scrolls.
 */
export const OverflowingTabs: Story = {
  render: () => (
    <div className="w-full max-w-[390px] py-4">
      <Controlled
        initial="approvals"
        render={(value, setValue) => (
          <SegmentedControl
            data-testid="overflow-tabs"
            aria-label="Work"
            variant="tabs"
            value={value}
            onValueChange={setValue}
            options={workTabs}
            className="w-full px-4"
          />
        )}
      />
    </div>
  ),
}

/** A row control a host made scroll instead of wrap, beside a page title. */
export const OverflowingRow: Story = {
  render: () => (
    <div className="flex w-full max-w-[390px] items-center gap-3 px-4 py-4">
      <h2 className="shrink-0 text-lg font-semibold">Files</h2>
      <Controlled
        initial="knowledge"
        render={(value, setValue) => (
          <SegmentedControl
            data-testid="overflow-row"
            aria-label="File source"
            value={value}
            onValueChange={setValue}
            options={fileSources}
            className="min-w-0 flex-nowrap overflow-x-auto"
          />
        )}
      />
    </div>
  ),
}
