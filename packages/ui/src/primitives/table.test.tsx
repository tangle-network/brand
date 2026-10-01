import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, type TableProps } from "./table";

function UsageTable(props: TableProps) {
  return <Table {...props}>
    <TableCaption>Usage</TableCaption>
    <TableHeader><TableRow><TableHead scope="col" id="resource">Resource</TableHead><TableHead scope="col" id="count">Count</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableHead scope="row" id="builds">Builds</TableHead><TableCell headers="builds count">3</TableCell></TableRow></TableBody>
    <TableFooter><TableRow><TableCell colSpan={2}>One resource</TableCell></TableRow></TableFooter>
  </Table>;
}

describe("Table", () => {
  it("preserves the default wrapper without imposing an unnamed region or tab stop", () => {
    render(<UsageTable />);
    const table = screen.getByRole("table", { name: "Usage" });
    expect(table.parentElement?.tagName).toBe("DIV");
    expect(table.parentElement).toHaveClass("relative", "w-full", "overflow-auto");
    expect(table.parentElement).not.toHaveAttribute("role");
    expect(table.parentElement).not.toHaveAttribute("tabindex");
  });

  it("retains native caption, table sections, headers, scope and spans", () => {
    render(<UsageTable />);
    const table = screen.getByRole("table", { name: "Usage" });
    expect(Array.from(table.children).map((node) => node.tagName)).toEqual(["CAPTION", "THEAD", "TBODY", "TFOOT"]);
    expect(screen.getByRole("columnheader", { name: "Resource" })).toHaveAttribute("scope", "col");
    expect(screen.getByRole("rowheader", { name: "Builds" })).toHaveAttribute("scope", "row");
    expect(screen.getByRole("cell", { name: "3" })).toHaveAttribute("headers", "builds count");
    expect(screen.getByRole("cell", { name: "One resource" })).toHaveAttribute("colspan", "2");
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("allows a caller-named keyboard-focusable wrapper separately from table attributes", async () => {
    const user = userEvent.setup();
    render(<><h2 id="usage-title">Resource usage</h2><UsageTable id="usage-table" className="min-w-[40rem]" wrapperProps={{ role: "region", "aria-labelledby": "usage-title", tabIndex: 0, className: "max-h-80" }} /></>);
    const region = screen.getByRole("region", { name: "Resource usage" });
    const table = within(region).getByRole("table", { name: "Usage" });
    expect(region).toHaveClass("max-h-80", "overflow-auto");
    expect(table).toHaveAttribute("id", "usage-table");
    expect(table).not.toHaveAttribute("tabindex");
    expect(table).not.toHaveClass("max-h-80");
    await user.tab();
    expect(region).toHaveFocus();
  });

  it("returns a bare table for a caller-owned scroll region, without leaking wrapper props", () => {
    render(<div role="region" aria-label="Outer" className="overflow-auto">
      <UsageTable wrapper={false} wrapperProps={{ id: "unused-wrapper" }} />
    </div>);
    const outer = screen.getByRole("region", { name: "Outer" });
    const table = screen.getByRole("table", { name: "Usage" });
    expect(outer.firstElementChild).toBe(table);
    expect(outer.querySelectorAll(".overflow-auto")).toHaveLength(0);
    expect(table).not.toHaveAttribute("wrapper");
    expect(table).not.toHaveAttribute("wrapperProps");
    expect(table).not.toHaveAttribute("id", "unused-wrapper");
  });

  it("keeps the public ref and native attributes/handlers on the table", async () => {
    const ref = createRef<HTMLTableElement>();
    const onClick = vi.fn();
    render(<Table ref={ref} cellPadding={0} onClick={onClick} aria-label="Details"><TableBody><TableRow><TableCell>Open</TableCell></TableRow></TableBody></Table>);
    expect(ref.current).toBe(screen.getByRole("table", { name: "Details" }));
    expect(ref.current).toHaveAttribute("cellpadding", "0");
    await userEvent.setup().click(screen.getByRole("cell", { name: "Open" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
