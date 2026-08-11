import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill, type StatusTone } from "./status-pill";

const TONES: StatusTone[] = [
  "success",
  "warning",
  "danger",
  "info",
  "running",
  "neutral",
];

describe("StatusPill", () => {
  it("states the status as text, not colour alone", () => {
    render(<StatusPill tone="danger">Failed</StatusPill>);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  // The glyph is the channel that survives greyscale and colour blindness, so
  // every tone must carry one and it must be hidden from the accessibility tree
  // — the label beside it already says the same thing.
  it.each(TONES)("gives %s a decorative glyph", (tone) => {
    const { container } = render(<StatusPill tone={tone}>Status</StatusPill>);
    const glyph = container.querySelector("svg");
    expect(glyph).not.toBeNull();
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });

  it.each(TONES)("brings %s's own paired background", (tone) => {
    const { container } = render(<StatusPill tone={tone}>Status</StatusPill>);
    const pill = container.firstElementChild as HTMLElement;
    expect(pill.className).toContain(`bg-[var(--surface-`);
    expect(pill.className).toContain("border");
  });

  // A tone colour is solved against its own background. `bare` drops that
  // background, so the tone may ride on the glyph only — lifting it onto the
  // label would put it on whatever plane the caller happens to be on.
  it.each(TONES)("keeps %s's tone off the label in bare mode", (tone) => {
    const { container } = render(
      <StatusPill bare tone={tone}>
        Status
      </StatusPill>,
    );
    const pill = container.firstElementChild as HTMLElement;
    expect(pill.className).toContain("bg-transparent");
    expect(pill.className).not.toContain("bg-[var(--surface-");

    const glyphWrapper = container.querySelector("svg")
      ?.parentElement as HTMLElement;
    expect(glyphWrapper.className).toContain("text-[var(--surface-");
  });

  // Guards the reason TONE_TEXT is declared rather than recovered by searching
  // TONE_SURFACE for a `text-` class: a miss there yields undefined and removes
  // the tone from the only channel bare mode has left.
  it.each(TONES)("resolves a real text class for %s in bare mode", (tone) => {
    const { container } = render(
      <StatusPill bare tone={tone}>
        Status
      </StatusPill>,
    );
    const glyphWrapper = container.querySelector("svg")
      ?.parentElement as HTMLElement;
    expect(glyphWrapper.className).not.toContain("undefined");
    expect(glyphWrapper.className).toMatch(/text-\[var\(--surface-[a-z]+-text\)\]/);
  });

  it("gives no two tones the same silhouette", () => {
    const shapes = TONES.map((tone) => {
      const { container } = render(<StatusPill tone={tone}>S</StatusPill>);
      return container.querySelector("svg")?.innerHTML ?? "";
    });
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it("takes a larger size", () => {
    const { container } = render(
      <StatusPill size="md" tone="info">
        Queued
      </StatusPill>,
    );
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "text-sm",
    );
  });
});
