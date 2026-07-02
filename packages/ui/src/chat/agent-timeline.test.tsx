import { render, screen } from "@testing-library/react"
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
})
