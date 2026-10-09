import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TaskList, showsTaskPriority, taskProgress } from "./task-list";

afterEach(cleanup);

const items = [
  { id: "1", title: "Find the hero source", status: "completed", priority: "high" },
  { id: "2", title: "Prepare the smallest edit", status: "in_progress", priority: "high" },
  { id: "3", title: "Open a draft PR", status: "pending", priority: "high" },
];

describe("TaskList", () => {
  it("names progress in the header and each state as a pill", () => {
    render(<TaskList items={items} />);
    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("To do")).toBeInTheDocument();
  });

  it("hides priority when every task shares it and shows it when they differ", () => {
    const { rerender } = render(<TaskList items={items} />);
    expect(screen.queryByText("High")).toBeNull();
    rerender(<TaskList items={[...items.slice(0, 2), { ...items[2], priority: "low" }]} />);
    expect(screen.getAllByText("High")).toHaveLength(2);
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("leaves cancelled tasks out of the done count", () => {
    expect(taskProgress([...items, { id: "4", title: "Skip", status: "cancelled" }])).toEqual({ done: 1, total: 3 });
    expect(showsTaskPriority([{ id: "a", title: "a", status: "pending" }])).toBe(false);
  });
});
