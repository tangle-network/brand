import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import type { SessionMessage } from "../types/message"
import type { SessionPart, ToolPart } from "../types/parts"
import { ChatContainer } from "./chat-container"

// jsdom has no layout engine; the auto-scroll hook calls scrollIntoView.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const messages: SessionMessage[] = [
  { id: "m1", role: "assistant" },
]

const editPart: ToolPart = {
  type: "tool",
  id: "tool-1",
  tool: "edit",
  state: {
    status: "completed",
    input: { path: "src/batch-writer.ts" },
    output: "Applied 1 edit to src/batch-writer.ts",
  },
}

const partMap: Record<string, SessionPart[]> = { m1: [editPart] }

describe("ChatContainer timeline tool rendering", () => {
  it("shows thinking as soon as a submitted user message is streaming", () => {
    render(
      <ChatContainer
        messages={[{ id: "user-1", role: "user" }]}
        partMap={{
          "user-1": [{ type: "text", text: "hello" }],
        }}
        isStreaming
        presentation="timeline"
      />,
    )

    expect(
      screen.getByRole("status", { name: "Agent is thinking" }),
    ).toBeInTheDocument()
  })

  it("does not let an earlier assistant reply hide the next turn's thinking state", () => {
    render(
      <ChatContainer
        messages={[
          { id: "user-1", role: "user" },
          { id: "assistant-1", role: "assistant" },
          { id: "user-2", role: "user" },
        ]}
        partMap={{
          "user-1": [{ type: "text", text: "first" }],
          "assistant-1": [{ type: "text", text: "done" }],
          "user-2": [{ type: "text", text: "second" }],
        }}
        isStreaming
        presentation="timeline"
      />,
    )

    expect(
      screen.getByRole("status", { name: "Agent is thinking" }),
    ).toBeInTheDocument()
  })

  it("replaces the generic thinking row when the current reply has text", () => {
    render(
      <ChatContainer
        messages={[
          { id: "user-1", role: "user" },
          { id: "assistant-1", role: "assistant" },
        ]}
        partMap={{
          "user-1": [{ type: "text", text: "hello" }],
          "assistant-1": [{ type: "text", text: "working on it" }],
        }}
        isStreaming
        presentation="timeline"
      />,
    )

    expect(
      screen.queryByRole("status", { name: "Agent is thinking" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("working on it")).toBeInTheDocument()
  })

  it("shows a clean tool detail (the file path), not the raw input JSON", () => {
    render(
      <ChatContainer
        messages={messages}
        partMap={partMap}
        isStreaming={false}
        presentation="timeline"
      />,
    )

    expect(screen.getByText("src/batch-writer.ts")).toBeInTheDocument()
    // The raw `{ "path": ... }` input JSON must not leak into the summary row.
    expect(screen.queryByText(/"path"/)).not.toBeInTheDocument()
  })

  it("titles the tool row with the bare verb and prints the path once", () => {
    const { container } = render(
      <ChatContainer
        messages={messages}
        partMap={partMap}
        isStreaming={false}
        presentation="timeline"
      />,
    )

    expect(screen.getByText("Edit")).toBeInTheDocument()
    expect(screen.getAllByText("src/batch-writer.ts")).toHaveLength(1)
    expect(container.textContent).not.toContain("Edit src/batch-writer.ts")
  })

  it("stacks consecutive tool calls with no visible group header", () => {
    const readPart: ToolPart = {
      type: "tool",
      id: "tool-2",
      tool: "read",
      state: { status: "completed", input: { path: "src/lib/jitter.ts" }, output: "ok" },
    }
    render(
      <ChatContainer
        messages={messages}
        partMap={{ m1: [editPart, readPart] }}
        isStreaming={false}
        presentation="timeline"
      />,
    )

    expect(screen.queryByText(/tool activity/i)).not.toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Tool activity" })).toBeInTheDocument()
    expect(screen.getByText("Edit")).toBeInTheDocument()
    expect(screen.getByText("Read")).toBeInTheDocument()
  })

  it("shimmers a running tool's verb and shows no spinner", () => {
    const running: ToolPart = {
      type: "tool",
      id: "tool-3",
      tool: "bash",
      state: { status: "running", input: { command: "pnpm build" }, time: { start: 1 } },
    }
    const { container } = render(
      <ChatContainer
        messages={[{ id: "user-1", role: "user" }, { id: "m1", role: "assistant" }]}
        partMap={{ "user-1": [{ type: "text", text: "build" }], m1: [running] }}
        isStreaming
        presentation="timeline"
      />,
    )

    const shimmer = container.querySelector(".tangle-text-shimmer")
    expect(shimmer).not.toBeNull()
    expect(shimmer!.textContent).toBe("Shell")
    expect(container.querySelector(".animate-spin")).toBeNull()
  })

  it("threads renderTimelineToolActions to the timeline tool item with its source part", () => {
    const renderTimelineToolActions = vi.fn((part: ToolPart) => (
      <button type="button">Open {part.id}</button>
    ))

    render(
      <ChatContainer
        messages={messages}
        partMap={partMap}
        isStreaming={false}
        presentation="timeline"
        renderTimelineToolActions={renderTimelineToolActions}
      />,
    )

    expect(renderTimelineToolActions).toHaveBeenCalled()
    expect(renderTimelineToolActions.mock.calls[0][0]).toMatchObject({
      id: "tool-1",
    })
    expect(
      screen.getByRole("button", { name: /open tool-1/i }),
    ).toBeInTheDocument()
  })
})
