import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextShimmer } from "./text-shimmer";

describe("TextShimmer", () => {
  it("wraps the label in the shimmer class and keeps the text readable", () => {
    const { container } = render(<TextShimmer>Thinking…</TextShimmer>);
    const span = container.querySelector(".tangle-text-shimmer");
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe("Thinking…");
  });

  it("injects its stylesheet once for any number of instances", () => {
    render(
      <>
        <TextShimmer>one</TextShimmer>
        <TextShimmer>two</TextShimmer>
      </>,
    );
    const sheets = document.querySelectorAll("#tangle-text-shimmer-styles");
    expect(sheets).toHaveLength(1);
    expect(sheets[0].textContent).toContain("@keyframes tangle-text-shimmer");
    expect(sheets[0].textContent).toContain("mask-image");
    expect(sheets[0].textContent).toContain("prefers-reduced-motion");
  });

  it("exposes the sweep period as the animation duration", () => {
    const { container } = render(
      <TextShimmer durationMs={900}>slow</TextShimmer>,
    );
    const span = container.querySelector<HTMLElement>(".tangle-text-shimmer");
    expect(span!.style.animationDuration).toBe("900ms");
  });
});
