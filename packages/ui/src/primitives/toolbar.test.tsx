import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterField, Toolbar } from "./toolbar";

describe("Toolbar", () => {
  it("renders each slot it is given", () => {
    render(
      <Toolbar
        actions={<button type="button">Export</button>}
        filters={<span>Product</span>}
        search={<input aria-label="Search" type="search" />}
      />,
    );
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("omits a slot's wrapper entirely when it is not given", () => {
    const { container } = render(
      <Toolbar search={<input aria-label="Search" type="search" />} />,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.children).toHaveLength(1);
  });

  // Filters keep their content width while it fits and shrink (scrolling) only
  // once search reaches its 16rem floor; an even split clipped a third filter at
  // 1440px, and no floor left search 89px wide in an 832px toolbar.
  it("keeps filters at content width above a search floor, actions at content width", () => {
    const { container } = render(
      <Toolbar
        actions={<button type="button">Export</button>}
        filters={<span>Product</span>}
        search={<input aria-label="Search" type="search" />}
      />,
    );
    const [searchSlot, filterSlot, actionsSlot] = Array.from(
      (container.firstElementChild as HTMLElement).children,
    ) as HTMLElement[];
    const search = searchSlot.className.split(" ");
    const filters = filterSlot.className.split(" ");
    expect(search).toEqual(expect.arrayContaining(["lg:flex-1", "lg:min-w-64", "lg:max-w-sm", "min-w-0"]));
    expect(filters).toEqual(expect.arrayContaining(["lg:flex-initial", "min-w-0", "lg:overflow-x-auto"]));
    expect(filters).not.toContain("lg:flex-1");
    expect(actionsSlot.className).toContain("shrink-0");
    expect(actionsSlot.className).not.toContain("flex-1");
  });

  it("wraps the filters on a phone and scrolls one line from lg up", () => {
    const { container } = render(<Toolbar filters={<span>Product</span>} />);
    const filterSlot = (container.firstElementChild as HTMLElement)
      .children[0] as HTMLElement;
    const classes = filterSlot.className.split(" ");
    expect(classes).toContain("flex-wrap");
    expect(classes).not.toContain("overflow-x-auto");
    expect(classes).toContain("lg:flex-nowrap");
    expect(classes).toContain("lg:overflow-x-auto");
    expect(classes).toContain("min-w-0");
  });

  // A free child would render as a bare flex item with none of the slots'
  // guards, so it would size off its content and push the row into overflow.
  it("renders nothing for a stray child", () => {
    const { container } = render(
      // @ts-expect-error children is deliberately not part of the API
      <Toolbar>
        <span>stray</span>
      </Toolbar>,
    );
    expect(screen.queryByText("stray")).toBeNull();
    expect((container.firstElementChild as HTMLElement).children).toHaveLength(
      0,
    );
  });
});

describe("FilterField", () => {
  it("labels the control visibly rather than by placeholder", () => {
    render(
      <FilterField htmlFor="product" label="Product">
        <select id="product">
          <option>All products</option>
        </select>
      </FilterField>,
    );
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByLabelText("Product")).toBe(
      screen.getByRole("combobox"),
    );
  });
});
