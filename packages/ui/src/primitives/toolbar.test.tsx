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

  // Search and filters both flex, on purpose: giving the filter row its content
  // width starves search — a 537px filter row in an 832px toolbar collapses the
  // search field to 89px. Sharing bounds the filter row so it scrolls within its
  // half and search stays usable. Only `actions` sits at content width.
  it("lets search and filters share the row, holding actions at content width", () => {
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
    expect(searchSlot.className).toContain("lg:flex-1");
    expect(searchSlot.className).toContain("min-w-0");
    // Both flex, so neither can starve the other.
    expect(filterSlot.className).toContain("lg:flex-1");
    expect(filterSlot.className).toContain("min-w-0");
    expect(actionsSlot.className).toContain("shrink-0");
    expect(actionsSlot.className).not.toContain("flex-1");
  });

  it("scrolls the filter row instead of wrapping it", () => {
    const { container } = render(<Toolbar filters={<span>Product</span>} />);
    const filterSlot = (container.firstElementChild as HTMLElement)
      .children[0] as HTMLElement;
    expect(filterSlot.className).toContain("overflow-x-auto");
    expect(filterSlot.className).toContain("min-w-0");
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
