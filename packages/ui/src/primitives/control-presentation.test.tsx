import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { controlHeight, controlText, fieldPresentation } from "../lib/control-presentation";
import { HelpText } from "./help-text";
import { Label } from "./label";
import { Button, buttonVariants } from "./button";
import { Input, Textarea } from "./input";
import { Select, SelectTrigger, SelectValue } from "./select";

afterEach(cleanup);

describe("shared control presentation", () => {
  it("uses the field well, not the border/track alias, with scoped foreground", () => {
    // The well is the brand's --well context variable; Toolbar can still pick the fill.
    expect(fieldPresentation).toContain("bg-[var(--field-surface,var(--well))]");
    expect(fieldPresentation.split(" ")).not.toContain("bg-input");
    expect(fieldPresentation.split(" ")).not.toContain("bg-card");
    // ixField's --field-border replaces focusField's resting border-border.
    expect(fieldPresentation.split(" ")).toContain("border-[var(--field-border)]");
    expect(fieldPresentation.split(" ")).not.toContain("border-border");
    expect(fieldPresentation).toContain("text-foreground");
  });

  it("puts Button, Input, Textarea and SelectTrigger on one height and text scale", () => {
    const classes = (name: string) => screen.getByLabelText(name).className.split(" ");
    const { rerender } = render(<><Input aria-label="Input" /><Textarea aria-label="Textarea" /><Button aria-label="Action">Action</Button><Select><SelectTrigger aria-label="Select"><SelectValue /></SelectTrigger></Select></>);
    // The default is md for every control: one 36px height, one 14px text size, one corner.
    for (const name of ["Input", "Action", "Select"]) {
      expect(classes(name)).toContain(controlHeight.md);
      expect(classes(name)).toContain(controlText.md);
      expect(classes(name)).toContain("rounded-lg");
    }
    expect(classes("Textarea")).toContain(controlText.md);
    expect(screen.getByLabelText("Textarea").className).toContain("min-h-[120px]");
    for (const size of ["sm", "md", "lg"] as const) {
      rerender(<><Input size={size} aria-label="Input" /><Textarea size={size} aria-label="Textarea" /><Button size={size} aria-label="Action">Action</Button><Select><SelectTrigger size={size} aria-label="Select"><SelectValue /></SelectTrigger></Select></>);
      for (const name of ["Input", "Action", "Select"]) {
        expect(classes(name), `${name} ${size}`).toContain(controlHeight[size]);
        expect(classes(name), `${name} ${size}`).toContain(controlText[size]);
        expect(classes(name), `${name} ${size}`).toContain(size === "sm" ? "rounded-md" : "rounded-lg");
        expect(screen.getByLabelText(name)).not.toHaveAttribute("size");
      }
      expect(classes("Textarea")).toContain(controlText[size]);
    }
    // Fields never drop below 16px on a coarse pointer (iOS zooms on focus otherwise).
    for (const name of ["Input", "Textarea", "Select"]) expect(classes(name)).toContain("pointer-coarse:text-base");
    expect(classes("Action")).not.toContain("pointer-coarse:text-base");
  });

  it("keeps the explicit compact and touch sizes", () => {
    const { rerender } = render(<><Input size="compact" aria-label="Input" /><Button size="compact">Action</Button><Select><SelectTrigger size="compact" aria-label="Select"><SelectValue /></SelectTrigger></Select></>);
    for (const size of ["compact", "touch"] as const) {
      rerender(<><Input size={size} aria-label="Input" /><Textarea size={size} aria-label="Textarea" /><Button size={size}>Action</Button><Select><SelectTrigger size={size} aria-label="Select"><SelectValue /></SelectTrigger></Select></>);
      for (const name of ["Input", "Select"]) {
        expect(screen.getByLabelText(name).className).toContain(size === "compact" ? "h-[var(--control-height)]" : "min-h-11");
        expect(screen.getByLabelText(name).className.split(" ")).toContain("rounded-lg");
        expect(screen.getByLabelText(name)).not.toHaveAttribute("size");
      }
      expect(screen.getByText("Action").className).toContain(size === "compact" ? "h-[var(--control-height)]" : "min-h-11");
      expect(screen.getByLabelText("Textarea")).not.toHaveAttribute("size");
    }
  });

  it("lets a file input's selector button take the field's text size", () => {
    render(<Input type="file" size="lg" aria-label="Upload" />);
    const classes = screen.getByLabelText("Upload").className.split(" ");
    expect(classes).toContain("text-[length:var(--control-text-lg,1rem)]");
    expect(classes.filter((name) => name.startsWith("file:text-"))).toEqual([]);
  });

  it("gives icon buttons squares on the same heights", () => {
    render(<><Button size="icon-sm" aria-label="Small" /><Button size="icon" aria-label="Medium" /><Button size="icon-lg" aria-label="Large" /></>);
    expect(screen.getByLabelText("Small").className).toContain("size-[var(--control-height-sm,2rem)]");
    expect(screen.getByLabelText("Medium").className).toContain("size-[var(--control-height,2.25rem)]");
    expect(screen.getByLabelText("Large").className).toContain("size-[var(--control-height-lg,2.75rem)]");
  });

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

  it("uses accent ink for link actions while retaining filled action foregrounds and scale motion", () => {
    expect(buttonVariants({ variant: "link" })).toContain("text-[var(--accent-text)]");
    expect(buttonVariants({ variant: "default" })).toContain("text-primary-foreground");
    expect(buttonVariants({ variant: "destructive" })).toContain("text-destructive-foreground");
    expect(buttonVariants({ variant: "sandbox" })).toContain("text-[var(--btn-primary-text)]");
    expect(buttonVariants()).not.toContain("transition-all");
    expect(buttonVariants()).toContain("motion-reduce:active:scale-100");
  });
});

describe("SelectTrigger with a value longer than the trigger", () => {
  it("ends the value in an ellipsis with a gap before the chevron", () => {
    const value = "Luna — ReCenter Guest Concierge & Practitioner Desk";
    render(<Select value="concierge"><SelectTrigger aria-label="Agent" className="w-40"><SelectValue>{value}</SelectValue></SelectTrigger></Select>);
    const trigger = screen.getByLabelText("Agent");
    const classes = trigger.className.split(" ");
    // line-clamp cannot ellipsize a nowrap line: it clipped mid-glyph under the chevron.
    expect(trigger.className).not.toContain("line-clamp");
    expect(classes).toContain("[&>span]:truncate");
    expect(classes).toContain("[&>span]:min-w-0");
    expect(classes).toContain("gap-2");
    // The rule targets the value span, which Radix renders as the trigger's direct child.
    expect(trigger.querySelector(":scope > span")?.textContent).toBe(value);
  });
});
