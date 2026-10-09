import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Markdown } from "./markdown";
import { numericColumns, tableCsv } from "./markdown-table";

const TABLE = [
  "| Variant | Impressions | CTR % | Spend $ | Note |",
  "| --- | --- | --- | --- | --- |",
  "| Hero A | 12,400 | 2.50% | $182.40 | Wins on \"reach\", barely |",
  "| Hero B | 9,870 | 4.17% | $160.05 | =SUM(A1) |",
].join("\n");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Markdown tables", () => {
  it("renders a header row and right-aligns figures in tabular numerals", () => {
    render(<Markdown>{TABLE}</Markdown>);
    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual(["Variant", "Impressions", "CTR %", "Spend $", "Note"]);
    expect(headers[0].className).toContain("text-left");
    expect(headers[1].className).toContain("text-right");
    // Inside `.tangle-prose`, a vendored header rule cannot left-align a figure column.
    expect(headers[1].className).toContain("[.tangle-prose_&]:text-right");
    const cells = within(table).getAllByRole("cell");
    expect(cells[1].className).toContain("text-right");
    expect(cells[1].className).toContain("tabular-nums");
    expect(cells[0].className).not.toContain("text-right");
    expect(cells[4].className).not.toContain("tabular-nums");
  });

  it("scrolls inside a named, focusable region and never uses a tiny font", () => {
    render(<Markdown>{TABLE}</Markdown>);
    const region = screen.getByRole("region", { name: "Table" });
    expect(region.className).toContain("overflow-x-auto");
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.closest(".not-prose")).not.toBeNull();
    expect(screen.getByRole("table").className).toContain("text-sm");
    // Brand's raw-table prose rules skip the card, so the table never becomes its own scroller.
    expect(screen.getByRole("table").hasAttribute("data-markdown-table")).toBe(true);
    expect(document.body.innerHTML).not.toContain("text-xs");
  });

  it("copies the table as CSV with quoting and formula-safe cells", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Markdown>{TABLE}</Markdown>);
    fireEvent.click(screen.getByRole("button", { name: "Copy CSV" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toBe([
      "Variant,Impressions,CTR %,Spend $,Note",
      "Hero A,\"12,400\",2.50%,$182.40,\"Wins on \"\"reach\"\", barely\"",
      "Hero B,\"9,870\",4.17%,$160.05,'=SUM(A1)",
    ].join("\n"));
    expect(await screen.findByText("Table copied as CSV")).toBeInTheDocument();
  });

  it("treats a column as numeric only when every filled cell is a figure", () => {
    expect(numericColumns([["a", "1", "", "$2.50"], ["b", "x", "3", "-4%"]])).toEqual([false, false, true, true]);
    expect(tableCsv([["a,b", " c"]])).toBe('"a,b"," c"');
  });
});
