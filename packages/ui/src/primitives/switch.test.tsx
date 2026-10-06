import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Switch } from "./switch";

afterEach(cleanup);

/** The classes that apply in a state: unprefixed ones, plus that state's variant. */
function stateClasses(el: Element, state: "checked" | "unchecked"): string[] {
  return (el.getAttribute("class") ?? "")
    .split(/\s+/)
    .filter((c) => !c.startsWith("data-[") || c.startsWith(`data-[state=${state}]:`))
    .map((c) => c.replace(`data-[state=${state}]:`, ""));
}

describe("Switch", () => {
  it("draws its off state in muted-foreground, so an unchecked switch is visible on a card or the canvas", () => {
    render(<Switch aria-label="Reminders" />);
    const track = screen.getByRole("switch", { name: "Reminders" });
    const thumb = track.firstElementChild as Element;
    expect(track).toHaveAttribute("data-state", "unchecked");
    expect(stateClasses(track, "unchecked")).toContain("border-muted-foreground");
    expect(stateClasses(track, "unchecked")).not.toContain("bg-input");
    expect(stateClasses(thumb, "unchecked")).toContain("bg-muted-foreground");
    expect(stateClasses(thumb, "unchecked")).not.toContain("bg-background");
  });

  it("draws its on state as an accent-text track with a card thumb, so a checked switch clears 3:1 in every theme", () => {
    render(<Switch aria-label="Reminders" />);
    const track = screen.getByRole("switch", { name: "Reminders" });
    fireEvent.click(track);
    expect(track).toHaveAttribute("data-state", "checked");
    const thumb = track.firstElementChild as Element;
    expect(stateClasses(track, "checked")).toContain("bg-[var(--accent-text)]");
    expect(stateClasses(track, "checked")).toContain("border-transparent");
    expect(stateClasses(track, "checked")).not.toContain("bg-primary");
    expect(stateClasses(thumb, "checked")).toContain("bg-card");
    expect(stateClasses(thumb, "checked")).not.toContain("bg-background");
  });
});
