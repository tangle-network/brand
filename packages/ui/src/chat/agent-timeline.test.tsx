import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ToolPart } from "../types/parts"
import { AgentTimeline, type AgentTimelineItem } from "./agent-timeline"

const editPart: ToolPart = {
  type: "tool",
  id: "tool-1",
  tool: "edit",
  state: {
    status: "completed",
    input: { path: "src/batch-writer.ts" },
    output: "Applied 1 edit",
  },
}

const readPart: ToolPart = {
  type: "tool",
  id: "tool-2",
  tool: "read",
  state: {
    status: "completed",
    input: { path: "src/lib/jitter.ts" },
    output: "export function jitter() {}",
  },
}

function toolItem(part: ToolPart): AgentTimelineItem {
  return {
    id: "item-1",
    kind: "tool",
    call: {
      id: part.id,
      type: "edit",
      label: "Edit src/batch-writer.ts",
      status: "success",
      detail: "src/batch-writer.ts",
      output: "Applied 1 edit",
    },
    part,
  }
}

describe("AgentTimeline tool actions", () => {
  it("renders a tool call's label and clean detail", () => {
    render(<AgentTimeline items={[toolItem(editPart)]} />)
    expect(screen.getByText("Edit src/batch-writer.ts")).toBeInTheDocument()
    expect(screen.getByText("src/batch-writer.ts")).toBeInTheDocument()
  })

  it("renders renderToolActions beside the tool item, called with the source part", () => {
    const renderToolActions = vi.fn((part: ToolPart) => (
      <button type="button">Open {part.id}</button>
    ))

    render(
      <AgentTimeline
        items={[toolItem(editPart)]}
        renderToolActions={renderToolActions}
      />,
    )

    expect(renderToolActions).toHaveBeenCalledWith(editPart)
    expect(
      screen.getByRole("button", { name: /open tool-1/i }),
    ).toBeInTheDocument()
  })

  it("renders no action when the item carries no source part", () => {
    const renderToolActions = vi.fn(() => <button type="button">Open</button>)
    const item = { ...toolItem(editPart), part: undefined }

    render(
      <AgentTimeline items={[item]} renderToolActions={renderToolActions} />,
    )

    expect(renderToolActions).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: /open/i })).not.toBeInTheDocument()
  })

  it("renders tool items unchanged when no renderToolActions is provided", () => {
    render(<AgentTimeline items={[toolItem(editPart)]} />)
    expect(screen.getByText("Edit src/batch-writer.ts")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /open/i })).not.toBeInTheDocument()
  })

  it("renders renderToolActions for each call in a tool group, with its part", () => {
    const renderToolActions = vi.fn((part: ToolPart) => (
      <button type="button">Open {part.id}</button>
    ))
    const groupItem: AgentTimelineItem = {
      id: "group-1",
      kind: "tool_group",
      title: "Tool activity",
      calls: [
        {
          id: "tool-1",
          type: "edit",
          label: "Edit src/batch-writer.ts",
          status: "success",
          detail: "src/batch-writer.ts",
        },
        {
          id: "tool-2",
          type: "read",
          label: "Read src/lib/jitter.ts",
          status: "success",
          detail: "src/lib/jitter.ts",
        },
      ],
      parts: [editPart, readPart],
    }

    render(
      <AgentTimeline items={[groupItem]} renderToolActions={renderToolActions} />,
    )

    expect(renderToolActions).toHaveBeenCalledWith(editPart)
    expect(renderToolActions).toHaveBeenCalledWith(readPart)
    expect(
      screen.getByRole("button", { name: /open tool-1/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /open tool-2/i }),
    ).toBeInTheDocument()
  })

  it("renders every row and no toggle when collapseAfter is unset", () => {
    const items: AgentTimelineItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `s-${i}`,
      kind: "status",
      label: `Step ${i}`,
    }))
    render(<AgentTimeline items={items} />)
    expect(screen.getByText("Step 4")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /more step/i }),
    ).not.toBeInTheDocument()
  })

  it("collapses to the first N spine rows behind a toggle and reveals the rest", async () => {
    const user = userEvent.setup()
    const items: AgentTimelineItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `s-${i}`,
      kind: "status",
      label: `Step ${i}`,
    }))
    render(<AgentTimeline items={items} collapseAfter={2} />)

    // First 2 visible, the other 3 hidden behind the toggle
    expect(screen.getByText("Step 0")).toBeInTheDocument()
    expect(screen.getByText("Step 1")).toBeInTheDocument()
    expect(screen.queryByText("Step 4")).not.toBeInTheDocument()

    const toggle = screen.getByRole("button", { name: /show 3 more steps/i })
    await user.click(toggle)

    expect(screen.getByText("Step 4")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument()
  })

  it("renders the source part's real input in the expanded detail", async () => {
    const user = userEvent.setup()
    const probePart: ToolPart = {
      type: "tool",
      id: "tool-3",
      tool: "custom_probe",
      state: {
        status: "completed",
        input: { marker: "deep-input-value" },
        output: "done",
      },
    }
    const item: AgentTimelineItem = {
      id: "item-3",
      kind: "tool",
      call: {
        id: "tool-3",
        type: "unknown",
        label: "custom_probe",
        status: "success",
        detail: "probe",
      },
      part: probePart,
    }

    render(<AgentTimeline items={[item]} />)
    await user.click(screen.getByRole("button", { name: /custom_probe/i }))

    // ExpandedToolDetail (fed the real part) renders labelled Input/Output
    // sections — the synthesized-part path showed only a bare output block.
    expect(screen.getByText("Input")).toBeInTheDocument()
    expect(screen.getByText("Output")).toBeInTheDocument()
  })
})
