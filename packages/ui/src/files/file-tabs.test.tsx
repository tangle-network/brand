import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FileTabs, type FileTabData } from "./file-tabs";

const TABS: FileTabData[] = [
  { id: "a", name: "records-graph-20261026a.md", path: "pages/graphs/records-graph-20261026a.md" },
  { id: "b", name: "parity.json", path: "run/parity.json", dirty: true },
  { id: "c", name: "README.md", path: "README.md" },
];

function Editor() {
  const [tabs, setTabs] = useState(TABS);
  const [active, setActive] = useState("a");
  return (
    <FileTabs
      tabs={tabs}
      activeId={active}
      onSelect={setActive}
      onClose={(id) => {
        const at = tabs.findIndex((tab) => tab.id === id);
        const rest = tabs.filter((tab) => tab.id !== id);
        setTabs(rest);
        if (id === active && rest.length) setActive(rest[Math.min(at, rest.length - 1)]!.id);
      }}
    />
  );
}

describe("FileTabs", () => {
  it("is one tab list with a single tab stop, named by each full file name", () => {
    render(<Editor />);
    const list = screen.getByRole("tablist", { name: "Open files" });
    const tabs = within(list).getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("aria-label"))).toEqual([
      "records-graph-20261026a.md",
      "parity.json, unsaved changes",
      "README.md",
    ]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    expect(screen.getByRole("tab", { name: "records-graph-20261026a.md" })).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]!.textContent).toBe("records-graph-20261026a.md");
  });

  it("moves the selection with arrow keys, Home and End, and closes the focused tab with Delete", () => {
    render(<Editor />);
    const first = screen.getByRole("tab", { name: "records-graph-20261026a.md" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "parity.json, unsaved changes" })).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "parity.json, unsaved changes" }));
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(screen.getByRole("tab", { name: "README.md" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "records-graph-20261026a.md" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(document.activeElement!, { key: "Delete" });
    expect(screen.queryByRole("tab", { name: "records-graph-20261026a.md" })).toBeNull();
    expect(screen.getByRole("tab", { name: "parity.json, unsaved changes" })).toHaveAttribute("aria-selected", "true");
  });

  it("closes a tab from its own close button", () => {
    render(<Editor />);
    fireEvent.click(screen.getByRole("button", { name: "Close README.md" }));
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("tells two open files of one name apart by their nearest differing folder", () => {
    render(
      <FileTabs
        tabs={[
          { id: "x", name: "CHECK.md", path: "code/route-a-lead-2/CHECK.md" },
          { id: "y", name: "CHECK.md", path: "code/rs3-merge-lead/CHECK.md" },
          { id: "z", name: "plan.md", path: "pages/plan.md" },
        ]}
        activeId="x"
        onSelect={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label"))).toEqual(["CHECK.md in route-a-lead-2", "CHECK.md in rs3-merge-lead", "plan.md"]);
    expect(screen.getByText("· route-a-lead-2")).toBeInTheDocument();
  });
});
