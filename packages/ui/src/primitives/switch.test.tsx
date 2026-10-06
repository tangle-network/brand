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

  it("fills the track with primary once it is on", () => {
    render(<Switch aria-label="Reminders" />);
    const track = screen.getByRole("switch", { name: "Reminders" });
    fireEvent.click(track);
    expect(track).toHaveAttribute("data-state", "checked");
    expect(stateClasses(track, "checked")).toContain("bg-primary");
    expect(stateClasses(track.firstElementChild as Element, "checked")).toContain("bg-background");
  });
});
