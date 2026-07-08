import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExpandableContent } from "./expandable-content";

describe("ExpandableContent", () => {
  let scrollHeightSpy: ReturnType<typeof vi.spyOn> | undefined;

  afterEach(() => {
    scrollHeightSpy?.mockRestore();
    scrollHeightSpy = undefined;
  });

  it("renders no toggle when content fits within the cap", () => {
    render(
      <ExpandableContent collapsedMaxPx={180}>
        <div>short</div>
      </ExpandableContent>,
    );
    expect(
      screen.queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });

  describe("when content overflows", () => {
    beforeEach(() => {
      scrollHeightSpy = vi
        .spyOn(HTMLElement.prototype, "scrollHeight", "get")
        .mockReturnValue(999);
    });

    it("clamps with a Show more toggle that expands and collapses", async () => {
      const user = userEvent.setup();
      render(
        <ExpandableContent collapsedMaxPx={180}>
          <div>tall content</div>
        </ExpandableContent>,
      );

      const showMore = screen.getByRole("button", { name: /show more/i });
      await user.click(showMore);
      expect(
        screen.getByRole("button", { name: /show less/i }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /show less/i }));
      expect(
        screen.getByRole("button", { name: /show more/i }),
      ).toBeInTheDocument();
    });
  });
});
