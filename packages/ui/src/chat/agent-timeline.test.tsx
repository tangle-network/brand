import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ToolPart } from "../types/parts"
import { AgentTimeline, type AgentTimelineItem } from "./agent-timeline"
import { TRANSCRIPT_TEXT } from "./transcript-text"

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
      label: "Edit",
      status: "success",
      detail: "src/batch-writer.ts",
      output: "Applied 1 edit",
    },
    part,
  }
}

describe("AgentTimeline tool actions", () => {
  it("renders a tool call's verb and its path, once each", () => {
    render(<AgentTimeline items={[toolItem(editPart)]} />)
    expect(screen.getByText("Edit")).toBeInTheDocument()
    expect(screen.getAllByText("src/batch-writer.ts")).toHaveLength(1)
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
    expect(screen.getByText("Edit")).toBeInTheDocument()
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
          label: "Edit",
          status: "success",
          detail: "src/batch-writer.ts",
        },
        {
          id: "tool-2",
          type: "read",
          label: "Read",
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

  it("names a tool group for assistive tech but draws no header above it", () => {
    const groupItem: AgentTimelineItem = {
      id: "group-1",
      kind: "tool_group",
      title: "Tool activity",
      calls: [
        { id: "tool-1", type: "edit", label: "Edit", status: "success", detail: "src/a.ts" },
        { id: "tool-2", type: "read", label: "Read", status: "success", detail: "src/b.ts" },
      ],
      parts: [editPart, readPart],
    }
    render(<AgentTimeline items={[groupItem]} />)
    expect(screen.queryByText("Tool activity")).not.toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Tool activity" })).toBeInTheDocument()
  })

  it("renders assistant prose without a timestamp header", () => {
    const stamp = new Date(2026, 0, 1, 15, 42)
    render(
      <AgentTimeline
        items={[
          { id: "a-1", kind: "message", role: "assistant", content: "Done.", timestamp: stamp },
        ]}
      />,
    )
    expect(screen.getByText("Done.")).toBeInTheDocument()
    expect(
      screen.queryByText(
        stamp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      ),
    ).not.toBeInTheDocument()
  })

  it("keeps the user bubble's timestamp", () => {
    const stamp = new Date(2026, 0, 1, 15, 42)
    render(
      <AgentTimeline
        items={[{ id: "u-1", kind: "message", role: "user", content: "Hi", timestamp: stamp }]}
      />,
    )
    expect(
      screen.getByText(
        stamp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      ),
    ).toBeInTheDocument()
  })

  it("lays rows out in a plain column — no spine gutter, no connector", () => {
    const { container } = render(
      <AgentTimeline
        items={[
          { id: "a-1", kind: "message", role: "assistant", content: "Reading." },
          toolItem(editPart),
          { id: "s-1", kind: "status", label: "Type-checks clean", tone: "success" },
        ]}
      />,
    )
    expect(container.querySelector('[class*="grid-cols-"]')).toBeNull()
    expect(container.querySelector(".ring-4")).toBeNull()
    const steps = container.querySelectorAll("[data-timeline-step]")
    expect(Array.from(steps).map((el) => el.getAttribute("data-timeline-step"))).toEqual([
      "prose",
      "tool",
      "card",
    ])
    // Tool rows bleed past the prose edge so the glyph sits on it.
    expect(steps[1].className).toContain("-mx-3")
    expect(steps[0].className).not.toContain("-mx-3")
  })

  it("spaces rows by their neighbours: turns widest, tool sequences tightest", () => {
    const tool2 = { ...toolItem(readPart), id: "item-2" }
    const { container } = render(
      <AgentTimeline
        items={[
          { id: "u-1", kind: "message", role: "user", content: "Go" },
          toolItem(editPart),
          tool2,
          { id: "a-1", kind: "message", role: "assistant", content: "Done." },
          { id: "u-2", kind: "message", role: "user", content: "Thanks" },
        ]}
      />,
    )
    const classes = Array.from(container.querySelectorAll("[data-timeline-step]")).map(
      (el) => el.className,
    )
    expect(classes[0]).not.toMatch(/mt-\d/)
    expect(classes[1]).toContain("mt-4") // user → tool: turn boundary
    expect(classes[2]).toContain("mt-1") // tool → tool
    expect(classes[3]).toContain("mt-1") // tool → prose
    expect(classes[4]).toContain("mt-4") // prose → user
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

describe("transcript type scale", () => {
  it("sets the person's and the agent's message text in one family, size and leading", () => {
    render(
      <AgentTimeline
        items={[
          { id: "u", kind: "message", role: "user", content: "Can Luz take the 3 pm massage?" },
          { id: "a", kind: "message", role: "assistant", content: "Yes, Luz is free at 3 pm." },
        ]}
      />,
    )
    const user = screen.getByText("Can Luz take the 3 pm massage?")
    const agent = screen.getByText("Yes, Luz is free at 3 pm.").closest(".tangle-prose")
    const textClasses = (element: Element | null) =>
      [...(element?.classList ?? [])].filter((name) => /^(tangle-transcript-text|text-|leading-|font-)/.test(name)).sort()
    expect(textClasses(user)).toEqual(TRANSCRIPT_TEXT.split(" ").sort())
    expect(textClasses(agent)).toEqual(textClasses(user))
  })
})

describe("AgentTimeline status cards", () => {
  it("marks a failed card with the failed glyph and keeps the triangle for warnings", () => {
    const glyph = (tone: "error" | "warning") =>
      render(<AgentTimeline items={[{ id: tone, kind: "status", label: tone, tone }]} />).container.querySelector("svg")?.getAttribute("class")
    expect(glyph("error")).toContain("lucide-circle-x")
    expect(glyph("warning")).toContain("lucide-triangle-alert")
  })
})

describe("AgentTimeline folds", () => {
  const call = (id: string, type: "read" | "bash", detail: string, status: "success" | "error" = "success"): AgentTimelineItem => ({
    id,
    kind: "tool",
    call: { id, type, label: type === "read" ? "Read" : "Shell", status, detail },
    part: { type: "tool", id, tool: type, state: status === "error" ? { status: "error", input: { path: detail }, error: `File not found: ${detail}` } : { status: "completed", input: { path: detail }, output: "ok" } },
  })

  it("folds a run of calls into one row that names what they did and opens to the rows", async () => {
    const user = userEvent.setup()
    render(<AgentTimeline items={[{ id: "f", kind: "fold", items: [call("a", "read", "inputs/commission.md"), call("b", "read", "inputs/claims.json"), call("c", "bash", "ls repo")] }]} />)
    const row = screen.getByRole("button", { name: /Read 2 files · Ran 1 command/ })
    expect(screen.queryByText("Shell")).not.toBeInTheDocument()
    await user.click(row)
    expect(screen.getByText("Shell")).toBeInTheDocument()
    expect(screen.getAllByText("Read")).toHaveLength(2)
  })

  it("keeps a failure visible under a closed fold", () => {
    render(<AgentTimeline items={[{ id: "f", kind: "fold", items: [call("a", "read", "a.md"), call("b", "read", "b.md", "error")] }]} />)
    expect(screen.getByText("1 failed: File not found: b.md")).toBeInTheDocument()
  })
})
