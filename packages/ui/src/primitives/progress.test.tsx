import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./progress";

describe("Progress", () => {
  it("announces its reading and reads complete at its maximum", () => {
    render(
      <>
        <Progress value={10} aria-label="Seats used" />
        <Progress value={100} tone="danger" aria-label="Projects used" />
      </>,
    );
    const seats = screen.getByRole("progressbar", { name: "Seats used" });
    expect(seats).toHaveAttribute("aria-valuenow", "10");
    expect(seats).toHaveAttribute("aria-valuemax", "100");
    expect(seats).toHaveAttribute("data-state", "loading");
    expect(screen.getByRole("progressbar", { name: "Projects used" })).toHaveAttribute(
      "data-state",
      "complete",
    );
  });
});
