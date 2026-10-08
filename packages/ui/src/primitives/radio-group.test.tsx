import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";

afterEach(cleanup);

describe("RadioGroup", () => {
  it("chooses one item by click or arrow key and reports its value", async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="Plan" defaultValue="basic" onValueChange={onValueChange}>
        <div><RadioGroupItem id="basic" value="basic" /><Label htmlFor="basic">Basic</Label></div>
        <div><RadioGroupItem id="pro" value="pro" /><Label htmlFor="pro">Pro</Label></div>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Basic" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByText("Pro"));
    expect(onValueChange).toHaveBeenLastCalledWith("pro");
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Basic" })).toHaveAttribute("aria-checked", "false");
  });
});
