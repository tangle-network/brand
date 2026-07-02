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

  it("threads renderToolActions to the timeline tool item with its source part", () => {
    const renderToolActions = vi.fn((part: ToolPart) => (
      <button type="button">Open {part.id}</button>
    ))

    render(
      <ChatContainer
        messages={messages}
        partMap={partMap}
        isStreaming={false}
        presentation="timeline"
        renderToolActions={renderToolActions}
      />,
    )

    expect(renderToolActions).toHaveBeenCalled()
    expect(renderToolActions.mock.calls[0][0]).toMatchObject({ id: "tool-1" })
    expect(
      screen.getByRole("button", { name: /open tool-1/i }),
    ).toBeInTheDocument()
  })
})
