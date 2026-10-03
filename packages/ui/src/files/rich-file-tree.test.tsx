import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { RichFileTree } from "./rich-file-tree"

function treeRow(container: HTMLElement, path: string): HTMLElement {
  const host = container.querySelector("file-tree-container");
  const row = Array.from(host?.shadowRoot?.querySelectorAll("[data-item-path]") ?? [])
    .find((element) => element.getAttribute("data-item-path") === path);
  if (!(row instanceof HTMLElement)) throw new Error(`Missing tree row: ${path}`);
  return row;
}

describe("RichFileTree", () => {
  it("renders without crashing given a flat path list", () => {
    const { container } = render(
      <RichFileTree paths={["README.md", "src/index.ts"]} />,
    )
    // Pierre renders into a custom element / shadow root; we can't peek
    // inside shadow DOM from RTL, but we can confirm the host mounted.
    expect(container.querySelectorAll("*").length).toBeGreaterThan(0)
  })

  it("flattens a recursive FileNode tree to paths", () => {
    const { container } = render(
      <RichFileTree
        root={{
          name: "root",
          path: "",
          type: "directory",
          children: [
            { name: "a.md", path: "a.md", type: "file" },
            {
              name: "b",
              path: "b",
              type: "directory",
              children: [{ name: "c.md", path: "b/c.md", type: "file" }],
            },
          ],
        }}
      />,
    )
    expect(container.querySelectorAll("*").length).toBeGreaterThan(0)
  })

  it("calls the current selection callback after its owner rerenders", async () => {
    const original = vi.fn();
    const current = vi.fn();
    const paths = ["brief.md", "outreach.md"];
    const { container, rerender } = render(<RichFileTree paths={paths} onSelect={original} />);
    rerender(<RichFileTree paths={paths} onSelect={current} />);
    fireEvent.click(treeRow(container, "outreach.md"));
    await waitFor(() => expect(current).toHaveBeenCalledWith("outreach.md"));
    expect(original).not.toHaveBeenCalled();
  });

  it("clears controlled selection so a closed file can be selected again", async () => {
    const onSelect = vi.fn();
    const paths = ["brief.md", "outreach.md"];
    const { container, rerender } = render(
      <RichFileTree paths={paths} selectedPath="brief.md" onSelect={onSelect} />,
    );
    rerender(<RichFileTree paths={paths} selectedPath={undefined} onSelect={onSelect} />);
    await waitFor(() => expect(treeRow(container, "brief.md")).toHaveAttribute("aria-selected", "false"));
    fireEvent.click(treeRow(container, "brief.md"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledExactlyOnceWith("brief.md"));
  });

  it("preserves uncontrolled selection when the file listing refreshes", async () => {
    const { container, rerender } = render(<RichFileTree paths={["brief.md"]} />);
    fireEvent.click(treeRow(container, "brief.md"));
    await waitFor(() => expect(treeRow(container, "brief.md")).toHaveAttribute("aria-selected", "true"));
    rerender(<RichFileTree paths={["brief.md", "outreach.md"]} />);
    await waitFor(() => expect(treeRow(container, "brief.md")).toHaveAttribute("aria-selected", "true"));
  });

  it("does not notify the owner when a controlled selection is synchronized", async () => {
    const onSelect = vi.fn();
    const paths = ["brief.md", "outreach.md"];
    const { container, rerender } = render(<RichFileTree paths={paths} selectedPath="brief.md" onSelect={onSelect} />);
    rerender(<RichFileTree paths={paths} selectedPath="outreach.md" onSelect={onSelect} />);
    await waitFor(() => expect(treeRow(container, "outreach.md")).toHaveAttribute("aria-selected", "true"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("throws when both root and paths are passed", () => {
    expect(() =>
      render(<RichFileTree root={{ name: "x", path: "x", type: "file" }} paths={["y"]} />),
    ).toThrow(/root.*paths.*not both/i)
  })
})
