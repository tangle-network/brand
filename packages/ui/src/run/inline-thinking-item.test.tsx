import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReasoningPart } from "../types/parts";
import { InlineThinkingItem } from "./inline-thinking-item";

const TEXT = "**Ensuring workspace configuration** I need to be cautious because the saved file is not verifiable.";

function part(active: boolean): ReasoningPart {
  return { type: "reasoning", text: TEXT, time: active ? { start: Date.now() } : { start: 0, end: 4_000 } };
}

describe("InlineThinkingItem", () => {
  it("previews the reasoning as plain text, never raw markdown marks", () => {
    const { container } = render(<InlineThinkingItem part={part(false)} />);
    expect(container.textContent).toContain("Ensuring workspace configuration I need to be cautious");
    expect(container.textContent).not.toContain("**");
  });

  it("opens while the model thinks, by default", () => {
    render(<InlineThinkingItem part={part(true)} />);
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("stays closed while the model thinks when the product keeps deliberation out of view", () => {
    render(<InlineThinkingItem part={part(true)} openWhileActive={false} />);
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
  });
});
