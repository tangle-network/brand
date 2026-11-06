import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HelpText } from "./help-text";
import { Label } from "./label";
import { Input, Textarea } from "./input";
import { Select, SelectTrigger, SelectValue } from "./select";

afterEach(cleanup);

describe("shared control presentation", () => {
  it("renders labels and help text at one size each, and wires hint and error to the field", () => {
    render(<><Label htmlFor="x">Name</Label><HelpText>Plain</HelpText><Input label="Email" hint="We never share it" error="Enter an address" /></>);
    expect(screen.getByText("Name").className).toContain("text-[length:var(--font-size-label,0.875rem)]");
    for (const text of ["Plain", "We never share it", "Enter an address"]) {
      expect(screen.getByText(text).className).toContain("text-[length:var(--font-size-help,0.75rem)]");
    }
    expect(screen.getByText("Enter an address")).toHaveAttribute("data-tone", "error");
    const field = screen.getByLabelText("Email");
    const described = field.getAttribute("aria-describedby")!.split(" ");
    expect(described).toContain(screen.getByText("We never share it").id);
    expect(described).toContain(screen.getByText("Enter an address").id);
  });

  it("preserves field and trigger refs, caller overrides, invalid/disabled and autofill attributes", () => {
    const input = React.createRef<HTMLInputElement>();
    const textarea = React.createRef<HTMLTextAreaElement>();
    const trigger = React.createRef<HTMLButtonElement>();
    render(<><Input ref={input} aria-label="Email" autoComplete="email" aria-invalid className="h-8 bg-card" /><Textarea ref={textarea} aria-label="Notes" disabled /><Select disabled><SelectTrigger ref={trigger} aria-label="Choice" size="touch" className="h-12"><SelectValue placeholder="Choose" /></SelectTrigger></Select></>);
    expect(input.current).toBe(screen.getByLabelText("Email"));
    expect(input.current).toHaveAttribute("autocomplete", "email");
    expect(input.current).toHaveAttribute("aria-invalid", "true");
    expect(input.current!.className).toContain("autofill:shadow-");
    expect(input.current!.className.split(" ")).toContain("bg-card");
    expect(input.current!.className).not.toContain("bg-[var(--field-surface,var(--well))]");
    expect(textarea.current).toBeDisabled();
    expect(trigger.current).toBe(screen.getByLabelText("Choice"));
    expect(trigger.current).toBeDisabled();
    expect(trigger.current!.className.split(" ")).toContain("h-12");
  });
});
