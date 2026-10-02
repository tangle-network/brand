import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { SessionMessage } from "../types/message";
import type { SessionPart, TextPart, ToolPart } from "../types/parts";
import { useRunGroups } from "../hooks/use-run-groups";
import { ChatContainer, type ChatContainerProps } from "./chat-container";

// Only the missing browser layout API is stubbed; transcript components are real.
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });

const messages: SessionMessage[] = [
  { id: "user", role: "user" },
  { id: "assistant", role: "assistant" },
];
const text = (value: string): TextPart => ({ type: "text", text: value });
const note = (value: string): TextPart => ({ ...text(value), synthetic: true });
const read = (id: string, path: string): ToolPart => ({
  type: "tool", id, tool: "read",
  state: { status: "completed", input: { path }, output: "File read." },
});
const firstTool = read("first", "src/first.ts");
const secondTool = read("second", "src/second.ts");

function expectOrder(...values: string[]) {
  const nodes = values.map((value) => screen.getByText(value));
  for (let i = 1; i < nodes.length; i++) {
    expect(nodes[i - 1].compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
}

describe.each(["runs", "timeline"] as const)("synthetic transcript text: %s", (presentation) => {
  function view(partMap: Record<string, SessionPart[]>, extra: Partial<ChatContainerProps> = {}) {
    return <ChatContainer messages={messages} partMap={partMap} isStreaming={false} presentation={presentation} {...extra} />;
  }

  it("keeps mixed user and assistant notes in source order, outside speaker bubbles", () => {
    const { container } = render(view({
      user: [text("User before"), note("Delivery receipt"), text("User after")],
      assistant: [text("Assistant before"), note("Missing trace"), text("Assistant after")],
    }));
    expectOrder("User before", "Delivery receipt", "User after", "Assistant before", "Missing trace", "Assistant after");
    const notes = screen.getAllByRole("note", { name: "Application note" });
    expect(notes).toHaveLength(2);
    for (const element of notes) {
      expect(element.closest('.bg-foreground, .tangle-prose, [class*="rounded-[26px]"]')).toBeNull();
    }
    const bubbles = container.querySelectorAll(".bg-foreground.text-background");
    expect(bubbles).toHaveLength(2);
    for (const bubble of bubbles) expect(bubble).not.toHaveTextContent("Delivery receipt");
  });

  it("retains synthetic-only messages without inventing speaker text", () => {
    const { container } = render(view({ user: [note("Request receipt")], assistant: [note("No response persisted")] }));
    expectOrder("Request receipt", "No response persisted");
    expect(screen.getAllByRole("note")).toHaveLength(2);
    expect(screen.queryByText("Agent")).not.toBeInTheDocument();
    expect(container.querySelector(".bg-foreground, .tangle-prose")).toBeNull();
  });

  it("omits blank notes and blank source text", () => {
    render(view({ user: [note(" \n "), text(" ")], assistant: [note("\t"), text("\n")] }));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.queryByText("Agent")).not.toBeInTheDocument();
  });

  it("does not parse application notes as Markdown, HTML, or OpenUI", () => {
    const literal = '<em>literal</em>\n**not markdown**\n```json\n{"type":"heading","text":"Not a heading"}\n```';
    render(view({ user: [], assistant: [note(literal)] }));
    const element = screen.getByRole("note");
    expect(element.textContent).toContain(literal);
    expect(element.querySelector("em, strong, h1, h2, h3, button, a")).toBeNull();
    expect(element.innerHTML).toContain("&lt;em&gt;literal&lt;/em&gt;");
  });

  it("renders notes even when OpenUI rendering is disabled", () => {
    render(view({ user: [], assistant: [note("Receipt with OpenUI off")] }, { enableOpenUI: false }));
    expect(screen.getByRole("note")).toHaveTextContent("Receipt with OpenUI off");
  });

  it("retains repeated notes and their position rather than deduplicating content", () => {
    render(view({ user: [], assistant: [note("Same receipt"), text("Between receipts"), note("Same receipt")] }));
    const notes = screen.getAllByRole("note");
    expect(notes).toHaveLength(2);
    const middle = screen.getByText("Between receipts");
    expect(notes[0].compareDocumentPosition(middle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(middle.compareDocumentPosition(notes[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("preserves tool/note order and original tool callback arguments", async () => {
    const user = userEvent.setup();
    const activated = vi.fn();
    const renderRunTool = vi.fn<NonNullable<ChatContainerProps["renderToolActions"]>>((part, context) => (
      <button type="button" onClick={() => activated(part, context)}>Inspect {part.id}</button>
    ));
    const renderTimelineTool = vi.fn((part: ToolPart) => (
      <button type="button" onClick={() => activated(part)}>Inspect {part.id}</button>
    ));
    render(view({ user: [text("Read files")], assistant: [firstTool, note("Partial trace"), secondTool, text("Source answer")] }, {
      renderToolActions: renderRunTool,
      renderTimelineToolActions: renderTimelineTool,
    }));
    expectOrder("src/first.ts", "Partial trace", "src/second.ts", "Source answer");
    await user.click(screen.getByRole("button", { name: "Inspect second" }));
    expect(activated.mock.calls[0][0]).toBe(secondTool);
    if (presentation === "runs") {
      expect(activated.mock.calls[0][1]).toMatchObject({ messageId: "assistant", partIndex: 2 });
      expect(renderTimelineTool).not.toHaveBeenCalled();
      expect(screen.getByText("2 tools, 1 response")).toBeInTheDocument();
    } else {
      expect(renderRunTool).not.toHaveBeenCalled();
    }
  });

  it("does not treat an application receipt as the pending assistant reply", () => {
    const partMap = { user: [text("Question")], assistant: [note("Request accepted")] };
    const { rerender } = render(view(partMap, { isStreaming: true }));
    expect(screen.getByRole("note")).toHaveTextContent("Request accepted");
    if (presentation === "timeline") {
      expect(screen.getByRole("status", { name: "Agent is thinking" })).toBeInTheDocument();
    } else {
      expect(screen.getByText("Thinking")).toBeInTheDocument();
    }
    rerender(view({ ...partMap, assistant: [note("Request accepted"), text("Answer arrived")] }));
    expect(screen.getByRole("note")).toHaveTextContent("Request accepted");
    expect(screen.getByText("Answer arrived")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Agent is thinking" })).not.toBeInTheDocument();
    expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
  });
});

describe("run attribution and manual collapse", () => {
  it.each([false, true])("excludes notes from response statistics and summaries (only notes: %s)", (onlyNotes) => {
    const { result } = renderHook(() => useRunGroups({
      messages,
      partMap: { user: [text("Question")], assistant: onlyNotes ? [note("App receipt")] : [text("Authored answer"), note("App receipt")] },
      isStreaming: false,
    }));
    const group = result.current.find((entry) => entry.type === "run");
    expect(group?.type).toBe("run");
    if (group?.type !== "run") throw new Error("Expected the real run group");
    expect(group.run.stats.textPartCount).toBe(onlyNotes ? 0 : 1);
    expect(group.run.summaryText).toBe(onlyNotes ? null : "Authored answer");
  });

  it("restores note order on keyboard expansion, without quoting notes in the run summary", async () => {
    const user = userEvent.setup();
    render(<ChatContainer messages={messages} partMap={{ user: [text("Question")], assistant: [firstTool, note("App-only receipt"), text("Source answer")] }} isStreaming={false} />);
    expectOrder("src/first.ts", "App-only receipt", "Source answer");
    const toggle = screen.getByRole("button", { expanded: true, name: /Agent/ });
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent("1 tool, 1 response");
    expect(toggle).not.toHaveTextContent("App-only receipt");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expectOrder("src/first.ts", "App-only receipt", "Source answer");
  });

  it("restores notes behind the existing explicit timeline limit", async () => {
    const user = userEvent.setup();
    render(<ChatContainer messages={messages} partMap={{ user: [text("Question")], assistant: [firstTool, note("App-only receipt"), text("Source answer")] }} isStreaming={false} presentation="timeline" collapseTimelineAfter={1} />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show 2 more steps" }));
    expectOrder("src/first.ts", "App-only receipt", "Source answer");
    await user.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
