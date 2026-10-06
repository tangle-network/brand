import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "./chip";
import { IconTile, initialsOf } from "./icon-tile";
import { Tag } from "./tag";
import { CATEGORY_TONES, TONE_CLASSES, toneFor } from "./tone";

function FilterRow() {
  const [on, setOn] = React.useState<Record<string, boolean>>({ Drafts: true, Scheduled: false });
  return (
    <div>
      {Object.keys(on).map((name) => (
        <Chip
          key={name}
          selected={on[name]}
          onSelectedChange={(next) => setOn((prev) => ({ ...prev, [name]: next }))}
        >
          {name}
        </Chip>
      ))}
    </div>
  );
}

describe("Chip", () => {
  it("is a native button that runs onClick when it is an action chip", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Draft a launch post</Chip>);
    const chip = screen.getByRole("button", { name: "Draft a launch post" });
    expect(chip).toHaveAttribute("type", "button");
    expect(chip).not.toHaveAttribute("aria-pressed");
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("toggles from the keyboard with Space and Enter and reports aria-pressed", async () => {
    const user = userEvent.setup();
    render(<FilterRow />);
    const drafts = screen.getByRole("button", { name: "Drafts" });
    const scheduled = screen.getByRole("button", { name: "Scheduled" });
    expect(drafts).toHaveAttribute("aria-pressed", "true");
    expect(scheduled).toHaveAttribute("aria-pressed", "false");

    await user.tab();
    expect(drafts).toHaveFocus();
    await user.keyboard(" ");
    expect(drafts).toHaveAttribute("aria-pressed", "false");

    await user.tab();
    expect(scheduled).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(scheduled).toHaveAttribute("aria-pressed", "true");
  });

  // Selection must survive greyscale: the check replaces the icon only when on.
  it("shows a check glyph only while selected", () => {
    const { rerender } = render(
      <Chip selected={false} icon={<svg data-testid="icon" />}>
        Video
      </Chip>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(document.querySelector(".lucide-check")).toBeNull();
    rerender(
      <Chip selected icon={<svg data-testid="icon" />}>
        Video
      </Chip>,
    );
    expect(screen.queryByTestId("icon")).toBeNull();
    expect(document.querySelector(".lucide-check")).not.toBeNull();
  });

  it("does not toggle while disabled", () => {
    const onSelectedChange = vi.fn();
    render(
      <Chip selected={false} disabled onSelectedChange={onSelectedChange}>
        Archived
      </Chip>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("lets a consumer onClick veto the toggle with preventDefault", () => {
    const onSelectedChange = vi.fn();
    render(
      <Chip selected={false} onClick={(e) => e.preventDefault()} onSelectedChange={onSelectedChange}>
        Locked
      </Chip>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Locked" }));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

describe("Tag", () => {
  it("is a static label with no tab stop of its own", async () => {
    render(<Tag tone="teal">Research</Tag>);
    expect(screen.getByText("Research")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("removes from the keyboard through a named remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>ada@example.com</Tag>);
    await user.tab();
    const remove = screen.getByRole("button", { name: "Remove ada@example.com" });
    expect(remove).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it("takes an explicit remove label when the label is not plain text", () => {
    render(
      <Tag onRemove={() => {}} removeLabel="Remove the LinkedIn channel">
        <strong>LinkedIn</strong>
      </Tag>,
    );
    expect(screen.getByRole("button", { name: "Remove the LinkedIn channel" })).toBeInTheDocument();
  });
});

describe("Tag wrap", () => {
  const LONG = "Adafruit-BME680-Temperature-Humidity-Pressure-Gas-Sensor-Breakout";

  it("truncates a long label by default and names it in a title", () => {
    render(<Tag>{LONG}</Tag>);
    const label = screen.getByText(LONG);
    expect(label.className).toContain("truncate");
    expect(label.getAttribute("title")).toBe(LONG);
    expect(label.parentElement?.className).toContain("h-6");
  });

  it("wraps a long label across lines when asked, aligned to its first line", () => {
    render(<Tag wrap size="md">{LONG}</Tag>);
    const label = screen.getByText(LONG);
    expect(label.className).not.toContain("truncate");
    expect(label.className).toContain("[overflow-wrap:anywhere]");
    expect(label.className).toContain("py-[3px]");
    expect(label.parentElement?.className).toContain("items-start");
    expect(label.parentElement?.className).not.toMatch(/(^|\s)h-7(\s|$)/);
  });
});

describe("IconTile", () => {
  it("falls back from a broken image to the glyph, then to initials", () => {
    const { container, rerender } = render(<IconTile src="https://example.invalid/logo.png" name="Acme Robotics" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("AR");

    rerender(<IconTile name="Acme Robotics" icon={<svg data-testid="glyph" />} />);
    expect(screen.getByTestId("glyph")).toBeInTheDocument();
  });

  it("is decorative unless it is given a label", () => {
    const { container, rerender } = render(<IconTile name="Acme" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    rerender(<IconTile name="Acme" label="Acme workspace" />);
    expect(screen.getByRole("img", { name: "Acme workspace" })).toBeInTheDocument();
  });

  it.each([
    ["Acme Robotics", "AR"],
    ["acme", "AC"],
    ["jane.doe", "JD"],
    ["  ", ""],
    ["李 小龍", "李小"],
    ["🦊 fox", "🦊F"],
  ])("derives the initials of %j as %j", (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});

describe("toneFor", () => {
  it("gives a key the same categorical tone every time", () => {
    expect(toneFor("linkedin")).toBe(toneFor("linkedin"));
    expect(CATEGORY_TONES).toContain(toneFor("linkedin"));
  });

  it("spreads keys across the categorical set", () => {
    const used = new Set(Array.from({ length: 64 }, (_, i) => toneFor(`project-${i}`)));
    expect(used.size).toBe(CATEGORY_TONES.length);
  });

  // The sandbox-ui style bundle and Tailwind read class names statically, so
  // every tone's classes must name their own tone's tokens literally.
  it.each(CATEGORY_TONES)("writes %s's classes against its own tokens", (tone) => {
    for (const value of Object.values(TONE_CLASSES[tone])) {
      expect(value).toContain(`--tone-${tone}-`);
      expect(value).not.toMatch(new RegExp(`--tone-(?!${tone}-)`));
    }
  });
});
