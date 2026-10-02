import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SessionPart } from "../types/parts";
import { SyntheticText, userTextSegments } from "./synthetic-text";
import { UserMessage } from "./user-message";

const mixed: SessionPart[] = [
  { type: "text", text: "First" },
  { type: "text", text: "Second", synthetic: false },
  { type: "text", text: "Receipt", synthetic: true },
  { type: "text", text: "Third" },
  { type: "text", text: "Last receipt", synthetic: true },
];

describe("user text boundaries", () => {
  it("joins adjacent authored parts, keeps source indices and does not mutate the input", () => {
    const before = JSON.stringify(mixed);
    expect(userTextSegments(mixed)).toEqual([
      { index: 0, synthetic: false, text: "First\nSecond" },
      { index: 2, synthetic: true, text: "Receipt" },
      { index: 3, synthetic: false, text: "Third" },
      { index: 4, synthetic: true, text: "Last receipt" },
    ]);
    expect(JSON.stringify(mixed)).toBe(before);
  });

  it("skips empty content without merging across a synthetic boundary", () => {
    expect(userTextSegments([
      { type: "text", text: "Before" },
      { type: "text", text: " \n", synthetic: true },
      { type: "text", text: "After" },
    ])).toEqual([
      { index: 0, synthetic: false, text: "Before" },
      { index: 2, synthetic: false, text: "After" },
    ]);
    expect(userTextSegments([])).toEqual([]);
  });

  it("preserves a single joined bubble when no application note is present", () => {
    const { container } = render(<UserMessage parts={mixed.slice(0, 2)} />);
    expect(container.querySelectorAll(".bg-foreground.text-background")).toHaveLength(1);
    expect(container.querySelector(".whitespace-pre-wrap")?.textContent).toBe("First\nSecond");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it.each(["", "Direct content"])("preserves explicit content precedence: %j", (content) => {
    const { container } = render(<UserMessage content={content} parts={mixed} />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(container.textContent).toBe(content);
  });

  it("renders message actions once after all segments, even after a trailing note", () => {
    render(<UserMessage parts={mixed} actions={<button type="button">Retry message</button>} />);
    const action = screen.getByRole("button", { name: "Retry message" });
    const last = screen.getByText("Last receipt");
    expect(last.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Retry message" })).toHaveLength(1);
  });

  it("supports a note-only user message with one action and no inverse-theme bubble", () => {
    const { container } = render(<UserMessage parts={[mixed[2]]} actions={<button type="button">Inspect receipt</button>} />);
    expect(screen.getByRole("note")).toHaveTextContent("Receipt");
    expect(screen.getByRole("button", { name: "Inspect receipt" })).toBeInTheDocument();
    expect(container.querySelector(".bg-foreground")).toBeNull();
  });

  it("retains direct-content timestamps", () => {
    const { container } = render(<UserMessage content="Original words" timestamp={new Date("2026-01-01T12:00:00Z")} />);
    expect(container.querySelectorAll("[data-user-message-time]")).toHaveLength(1);
    expect(screen.getByText("Original words")).toBeInTheDocument();
  });

  it("renders a visible, named plain-text note and omits blanks", () => {
    const { rerender } = render(<SyntheticText text="No trace captured" />);
    expect(screen.getByRole("note", { name: "Application note" })).toHaveTextContent("No trace captured");
    expect(screen.getByText("Application note")).toBeVisible();
    rerender(<SyntheticText text={" \n "} />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
