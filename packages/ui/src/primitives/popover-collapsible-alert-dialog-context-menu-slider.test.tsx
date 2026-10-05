import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Slider } from "./slider";

const PALETTE = /\b(?:bg|text|border)-(?:slate|zinc|gray|neutral|blue|green|red|amber|emerald|black|white)(?:-\d|\b)/;

describe("Popover", () => {
  it("opens from its trigger on a token surface and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>Only failed runs</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const content = await screen.findByRole("dialog");
    expect(content).toHaveTextContent("Only failed runs");
    expect(content.className).toContain("bg-card");
    expect(content.className).not.toMatch(PALETTE);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("Collapsible", () => {
  it("reports its expanded state on the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>Hidden body</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Hidden body")).toBeNull();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Hidden body")).toBeVisible();
  });
});

describe("AlertDialog", () => {
  it("focuses Cancel on open so a destructive action is never under Enter", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete project</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>Its sandboxes stop.</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction tone="destructive" onClick={onDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this project?" });
    expect(dialog).toHaveAccessibleDescription("Its sandboxes stop.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    const action = screen.getByRole("button", { name: "Delete" });
    expect(action.className).toContain("bg-destructive");
    await user.click(action);
    expect(onDelete).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });
});

describe("ContextMenu", () => {
  it("opens on contextmenu and runs the chosen item", async () => {
    const onRename = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>File row</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onRename}>Rename</ContextMenuItem>
          <ContextMenuItem tone="destructive">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("File row"));
    const menu = await screen.findByRole("menu");
    expect(menu.className).toContain("bg-card");
    expect(screen.getByRole("menuitem", { name: "Delete" }).className).toContain("text-destructive");
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    expect(onRename).toHaveBeenCalledOnce();
  });

  it("portals submenu content out of the clipped parent menu", async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu>
        <ContextMenuTrigger>File row</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Archive</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("File row"));
    const parent = await screen.findByRole("menu");
    await user.hover(screen.getByRole("menuitem", { name: "Move to" }));
    await user.keyboard("{ArrowRight}");
    const archive = await screen.findByRole("menuitem", { name: "Archive" });
    expect(parent.contains(archive)).toBe(false);
  });
});

describe("Slider", () => {
  beforeAll(() => {
    // Radix measures the thumb with ResizeObserver, which jsdom lacks.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("renders one labelled thumb per value", () => {
    render(<Slider defaultValue={[20, 80]} thumbLabels={["Minimum", "Maximum"]} />);
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAccessibleName("Minimum");
    expect(thumbs[1]).toHaveAttribute("aria-valuenow", "80");
  });

  it("moves with the keyboard and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider aria-label="Budget" defaultValue={[50]} step={10} onValueChange={onValueChange} />);
    expect(screen.getByRole("slider")).toHaveAccessibleName("Budget");
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith([60]);
  });
});
