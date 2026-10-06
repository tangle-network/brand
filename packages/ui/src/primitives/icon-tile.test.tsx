import { render } from "@testing-library/react";
import { Globe } from "lucide-react";
import { describe, expect, it } from "vitest";
import { IconTile, initialsOf } from "./icon-tile";

describe("IconTile", () => {
  it.each([
    ["xs", "size-5"],
    ["sm", "size-6"],
    ["md", "size-8"],
    ["lg", "size-10"],
    ["xl", "size-16"],
    ["2xl", "size-20"],
  ] as const)("renders size %s as %s", (size, cls) => {
    const { container } = render(<IconTile size={size} name="Tangle Network" />);
    expect(container.firstElementChild).toHaveClass(cls);
  });

  it("scales the glyph with the large sizes", () => {
    const { container } = render(<IconTile size="2xl" tone="cyan" icon={<Globe />} />);
    expect(container.firstElementChild?.className).toContain("[&_svg]:size-10");
  });

  it("shows initials and is decorative without a label", () => {
    const { container } = render(<IconTile size="xl" name="Front-desk concierge" />);
    const tile = container.firstElementChild;
    expect(tile).toHaveTextContent("FC");
    expect(tile).toHaveAttribute("aria-hidden", "true");
  });

  it("is an image with an accessible name when labelled", () => {
    const { getByRole } = render(<IconTile size="xl" name="Acme" label="Acme" />);
    expect(getByRole("img", { name: "Acme" })).toBeInTheDocument();
  });

  it("keeps an emoji whole in the initials", () => {
    expect(initialsOf("🦊")).toBe("🦊");
  });
});
