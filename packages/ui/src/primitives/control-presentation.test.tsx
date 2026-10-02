import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { controlMotion, fieldPresentation } from "../lib/control-presentation";
import { Button, buttonVariants } from "./button";
import { Input, Textarea } from "./input";
import { Select, SelectTrigger, SelectValue } from "./select";

afterEach(cleanup);

describe("shared control presentation", () => {
  it("uses the field well, not the border/track alias, with scoped foreground and time-only motion", () => {
    expect(fieldPresentation).toContain("bg-[var(--bg-input)]");
    expect(fieldPresentation.split(" ")).not.toContain("bg-input");
    expect(fieldPresentation.split(" ")).not.toContain("bg-card");
    expect(fieldPresentation).toContain("border-border");
    expect(fieldPresentation).toContain("text-foreground");
    expect(fieldPresentation).not.toContain("duration-150");
    expect(controlMotion).toContain("duration-[var(--duration-fast)]");
    expect(controlMotion).not.toContain("--transition-fast");
    expect(controlMotion).toContain("motion-reduce:duration-0");
  });

  it("keeps original defaults and aligns only explicit compact/touch sizes", () => {
    const { rerender } = render(<><Input aria-label="Input" /><Textarea aria-label="Textarea" /><Button>Action</Button><Select><SelectTrigger aria-label="Select"><SelectValue /></SelectTrigger></Select></>);
    expect(screen.getByLabelText("Input").className.split(" ")).toContain("h-11");
    expect(screen.getByLabelText("Textarea").className).toContain("min-h-[120px]");
    expect(screen.getByLabelText("Select").className.split(" ")).toContain("h-9");
    expect(screen.getByText("Action").className).toContain("h-[var(--control-height)]");
    for (const size of ["compact", "touch"] as const) {
      rerender(<><Input size={size} aria-label="Input" /><Textarea size={size} aria-label="Textarea" /><Button size={size}>Action</Button><Select><SelectTrigger size={size} aria-label="Select"><SelectValue /></SelectTrigger></Select></>);
      for (const name of ["Input", "Select"]) {
        expect(screen.getByLabelText(name).className).toContain(size === "compact" ? "h-[var(--control-height)]" : "min-h-11");
        expect(screen.getByLabelText(name)).not.toHaveAttribute("size");
      }
      expect(screen.getByText("Action").className).toContain(size === "compact" ? "h-[var(--control-height)]" : "min-h-11");
      expect(screen.getByLabelText("Textarea")).not.toHaveAttribute("size");
    }
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
    expect(input.current!.className).not.toContain("bg-[var(--bg-input)]");
    expect(textarea.current).toBeDisabled();
    expect(trigger.current).toBe(screen.getByLabelText("Choice"));
    expect(trigger.current).toBeDisabled();
    expect(trigger.current!.className.split(" ")).toContain("h-12");
  });

  it("uses accent ink for link actions while retaining filled action foregrounds and scale motion", () => {
    expect(buttonVariants({ variant: "link" })).toContain("text-[var(--accent-text)]");
    expect(buttonVariants({ variant: "default" })).toContain("text-primary-foreground");
    expect(buttonVariants({ variant: "destructive" })).toContain("text-destructive-foreground");
    expect(buttonVariants({ variant: "sandbox" })).toContain("text-[var(--btn-primary-text)]");
    expect(buttonVariants()).not.toContain("transition-all");
    expect(buttonVariants()).toContain("box-shadow,transform,scale");
    expect(buttonVariants()).toContain("motion-reduce:active:scale-100");
  });
});
