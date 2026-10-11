import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { compile } from "tailwindcss";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { focusFieldWithin } from "../lib/focus";
import {
  ixControl,
  ixControlAfter,
  ixControlSoft,
  ixField,
  ixRow,
  ixSelected,
  ixTabUnderline,
} from "../lib/interaction";
import { Button } from "./button";
import { Card, CardDescription } from "./card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input, Textarea } from "./input";
import { SegmentedControl } from "./segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

/**
 * Every primitive draws its interaction states from one helper in
 * lib/interaction.ts (ROOT-SPEC section b). This is the cheap static guard:
 * each primitive's rendered className carries every class of its helper, so a
 * later edit or a tailwind-merge conflict cannot silently drop a state. The
 * second suite compiles each helper with Tailwind to prove the classes emit the
 * declarations and selectors the states need.
 */
afterEach(cleanup);
beforeAll(() => {
  // jsdom lacks the layout APIs Radix Select and Menu call while opening.
  Element.prototype.scrollIntoView ??= vi.fn();
  Element.prototype.hasPointerCapture ??= vi.fn(() => false);
  Element.prototype.releasePointerCapture ??= vi.fn();
});

const tokens = (helper: string) => helper.split(/\s+/).filter(Boolean);
const classes = (el: Element) => new Set(el.className.split(/\s+/));

/** Every class of every helper is on the element. */
function expectHelpers(el: Element, ...helpers: string[]) {
  const have = classes(el);
  for (const helper of helpers) {
    for (const token of tokens(helper)) expect(have, `${el.tagName} is missing ${token}`).toContain(token);
  }
}

/** The glow only strong controls get. */
const HOVER_GLOW = "hover:shadow-[var(--ix-hover)]";
/** focusRing, which every control keeps exactly. */
const FOCUS_RING = [
  "focus-visible:outline-1",
  "focus-visible:outline-[var(--focus-border)]",
  "focus-visible:ring-4",
  "focus-visible:ring-[var(--focus-halo)]",
];
/** focusField's `:focus` part, which every field keeps exactly. */
const FOCUS_FIELD = ["focus:outline-hidden", "focus:border-[var(--focus-border)]", "focus:ring-3", "focus:ring-[var(--focus-halo)]"];

describe("each primitive renders its interaction helper", () => {
  it.each(["default", "destructive", "secondary", "outline", "sandbox"] as const)(
    "Button %s takes ixControl and keeps the focus ring",
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      const button = screen.getByRole("button");
      expectHelpers(button, ixControl);
      for (const token of FOCUS_RING) expect(classes(button)).toContain(token);
    },
  );

  it.each(["ghost", "link", "bare"] as const)("Button %s takes ixControlSoft and never the hover glow", (variant) => {
    render(<Button variant={variant}>Go</Button>);
    const button = screen.getByRole("button");
    expectHelpers(button, ixControlSoft);
    expect(classes(button)).not.toContain(HOVER_GLOW);
    expect(classes(button)).not.toContain("hover:bg-muted");
    for (const token of FOCUS_RING) expect(classes(button)).toContain(token);
  });

  it.each(["outline", "ghost", "bare"] as const)("a %s toggle Button (aria-pressed) adds ixControl and ixSelected", (variant) => {
    render(<Button variant={variant} aria-pressed>Bold</Button>);
    expectHelpers(screen.getByRole("button"), ixControl, ixSelected);
  });

  it("Input and Textarea take ixField with focusField's focus border and halo", () => {
    render(<><Input aria-label="Name" /><Textarea aria-label="Notes" /></>);
    for (const field of [screen.getByLabelText("Name"), screen.getByLabelText("Notes")]) {
      expectHelpers(field, ixField);
      for (const token of FOCUS_FIELD) expect(classes(field)).toContain(token);
      expect(classes(field)).not.toContain("border-border");
      expect(classes(field)).not.toContain("hover:border-[var(--border-strong)]");
    }
  });

  it("focusFieldWithin is a field: ixField plus the has-focus ring, without the neutral hover", () => {
    expect(tokens(focusFieldWithin)).toEqual(expect.arrayContaining(tokens(ixField)));
    expect(focusFieldWithin).toContain("has-[");
    expect(focusFieldWithin).toContain(":focus]:ring-[var(--focus-halo)]");
    expect(tokens(focusFieldWithin)).not.toContain("hover:border-[var(--border-strong)]");
    expect(tokens(focusFieldWithin)).not.toContain("border-border");
  });

  it("SelectTrigger is a field that keeps its well and an after-click ring while open", () => {
    render(<Select><SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger></Select>);
    const trigger = screen.getByRole("combobox");
    expectHelpers(trigger, ixField, ixControlAfter);
    for (const token of FOCUS_FIELD) expect(classes(trigger)).toContain(token);
    expect(classes(trigger)).toContain("data-[state=open]:shadow-[var(--ix-after)]");
    expect(classes(trigger)).toContain("data-[state=open]:border-[var(--ix-hover-border)]");
    // The open state must not repaint the well.
    expect([...classes(trigger)].filter((c) => c.startsWith("data-[state=open]:bg-"))).toEqual([]);
  });

  it("SelectContent paints the popover level and SelectItem takes ixRow", async () => {
    render(
      <Select open value="a">
        <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="a">Active</SelectItem><SelectItem value="b">Paused</SelectItem></SelectContent>
      </Select>,
    );
    const listbox = await screen.findByRole("listbox");
    const content = listbox.closest("[data-radix-select-viewport]")?.parentElement ?? listbox;
    expect(classes(content)).toContain("bg-popover");
    expect(classes(content)).toContain("shadow-[var(--edge-highlight),var(--shadow-card)]");
    expect(classes(content)).not.toContain("bg-card");
    for (const option of screen.getAllByRole("option")) {
      expectHelpers(option, ixRow);
      expect(classes(option)).not.toContain("focus:bg-[var(--accent-surface-strong)]");
    }
  });

  it("DropdownMenu content paints the popover level and every item kind takes ixRow", async () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Pinned</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a"><DropdownMenuRadioItem value="a">Newest</DropdownMenuRadioItem></DropdownMenuRadioGroup>
          <DropdownMenuSub><DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger></DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const menu = await screen.findByRole("menu");
    expect(classes(menu)).toContain("bg-popover");
    expect(classes(menu)).toContain("shadow-[var(--edge-highlight),var(--shadow-card)]");
    expect(classes(menu)).not.toContain("bg-card");
    const items = [
      screen.getByRole("menuitem", { name: "Rename" }),
      screen.getByRole("menuitemcheckbox", { name: "Pinned" }),
      screen.getByRole("menuitemradio", { name: "Newest" }),
      screen.getByRole("menuitem", { name: "Move to" }),
    ];
    for (const item of items) {
      expectHelpers(item, ixRow);
      expect(classes(item)).not.toContain("focus:bg-muted/50");
    }
  });

  it("Card is a ladder level with a shadow; hover and interactive cards take ixControl", () => {
    render(
      <>
        <Card data-testid="plain" />
        <Card data-testid="hover" hover />
        <Card data-testid="interactive" interactive />
        <CardDescription>Guests, staff and vendors message your business on WhatsApp.</CardDescription>
      </>,
    );
    const plain = screen.getByTestId("plain");
    expect(plain).toHaveAttribute("data-slot", "card");
    expect(classes(plain)).toContain("shadow-[var(--edge-highlight),var(--shadow-card)]");
    expect(classes(plain)).not.toContain(HOVER_GLOW);
    for (const id of ["hover", "interactive"]) {
      const card = screen.getByTestId(id);
      expectHelpers(card, ixControl);
      expect(card).not.toHaveAttribute("interactive");
      expect(classes(card)).not.toContain("hover:border-[var(--border-strong)]");
    }
    expect(classes(screen.getByText(/Guests, staff/))).toContain("line-clamp-2");
  });

  it("SegmentedControl row: a well track, soft items, the selected state on aria-checked", () => {
    const options = [{ value: "a", label: "A–Z" }, { value: "b", label: "Recent" }];
    render(<SegmentedControl aria-label="Sort" value="a" onValueChange={() => {}} options={options} />);
    const track = screen.getByRole("radiogroup");
    expect(classes(track)).toContain("bg-[var(--well)]");
    expect(classes(track)).toContain("border-[var(--field-border)]");
    expect(classes(track)).not.toContain("bg-card");
    for (const radio of screen.getAllByRole("radio")) {
      expectHelpers(radio, ixControlSoft, ixSelected);
      for (const token of FOCUS_RING) expect(classes(radio)).toContain(token);
      expect(classes(radio)).not.toContain("bg-[var(--accent-surface)]");
    }
  });

  it("SegmentedControl tabs: the underline helper and a transparent border slot", () => {
    const options = [{ value: "a", label: "Team" }, { value: "b", label: "Roles" }];
    render(<SegmentedControl aria-label="Section" variant="tabs" value="a" onValueChange={() => {}} options={options} />);
    for (const radio of screen.getAllByRole("radio")) {
      expectHelpers(radio, ixTabUnderline);
      expect(classes(radio)).toContain("border-transparent");
      expect(classes(radio)).not.toContain("border-[var(--accent-text)]");
    }
  });

  it.each([
    ["default", [ixControlSoft, ixSelected]],
    ["pills", [ixControlSoft, ixSelected]],
    ["underline", [ixTabUnderline]],
  ] as const)("TabsTrigger %s takes its helper", (variant, helpers) => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant={variant}>
          <TabsTrigger variant={variant} value="a">Overview</TabsTrigger>
          <TabsTrigger variant={variant} value="b">Activity</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    for (const tab of screen.getAllByRole("tab")) {
      expectHelpers(tab, ...helpers);
      for (const token of FOCUS_RING) expect(classes(tab)).toContain(token);
      expect([...classes(tab)]).not.toEqual(expect.arrayContaining(["data-[state=active]:bg-background"]));
      expect(classes(tab)).not.toContain("data-[state=active]:border-primary");
    }
  });
});

describe("Tailwind compiles every interaction class to the state it names", () => {
  /** A fresh compiler per class, so each class's CSS is read on its own. */
  async function cssFor(candidate: string) {
    const compiler = await compile("@tailwind utilities;");
    return compiler.build([candidate]);
  }

  const all = [...new Set([ixControl, ixControlAfter, ixControlSoft, ixField, ixSelected, ixTabUnderline, ixRow].flatMap(tokens))];

  it.each(all)("%s emits a rule", async (candidate) => {
    expect(await cssFor(candidate)).toMatch(/\{[^}]*:[^}]*\}/);
  });

  it("composes the hover and press glows with the focus ring instead of replacing it", async () => {
    for (const [candidate, value] of [
      ["hover:shadow-[var(--ix-hover)]", "var(--ix-hover)"],
      ["active:shadow-[var(--ix-press)]", "var(--ix-press)"],
    ]) {
      const css = await cssFor(candidate);
      expect(css).toContain(`--tw-shadow: ${value}`);
      expect(css).toContain("var(--tw-ring-shadow), var(--tw-shadow)");
    }
  });

  it("keys the after-click ring on mouse focus only", async () => {
    const css = await cssFor("focus:not-focus-visible:shadow-[var(--ix-after)]");
    expect(css).toContain(":focus:not(:focus-visible)");
    expect(css).toContain("--tw-shadow: var(--ix-after)");
  });

  it("reads the field fill and border from the surface context", async () => {
    expect(await cssFor("bg-[var(--field-surface,var(--well))]")).toContain("background-color: var(--field-surface,var(--well))");
    expect(await cssFor("border-[var(--field-border)]")).toContain("border-color: var(--field-border)");
    expect(await cssFor("hover:border-[var(--ix-hover-border)]")).toContain("border-color: var(--ix-hover-border)");
  });

  it("draws selection on aria-pressed, aria-checked, aria-current, data-state on and active", async () => {
    const css = await cssFor("aria-[current=page]:shadow-[inset_0_0_0_1px_var(--ix-sel-ring)]");
    expect(css).toContain('[aria-current="page"]');
    expect(css).toContain("inset 0 0 0 1px");
    expect(await cssFor("aria-pressed:bg-[var(--ix-sel-bg)]")).toContain('[aria-pressed="true"]');
    expect(await cssFor("aria-checked:bg-[var(--ix-sel-bg)]")).toContain('[aria-checked="true"]');
    expect(await cssFor("data-[state=active]:bg-[var(--ix-sel-bg)]")).toContain('[data-state="active"]');
    expect(await cssFor("data-[highlighted]:bg-[var(--ix-sel-bg)]")).toContain("[data-highlighted]");
  });
});
