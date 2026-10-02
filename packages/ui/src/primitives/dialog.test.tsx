import { createRef, type ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./dialog";

function Example(props: ComponentProps<typeof DialogContent>) {
  return (
    <Dialog defaultOpen>
      <DialogContent {...props}>
        <DialogTitle>Confirm operation</DialogTitle>
        <DialogDescription>Choose whether to continue.</DialogDescription>
        <DialogClose asChild><button type="button">Cancel operation</button></DialogClose>
      </DialogContent>
    </Dialog>
  );
}

describe("DialogContent close-button visibility", () => {
  it("retains the default accessible close button and its dismissal behavior", async () => {
    const user = userEvent.setup();
    render(<Example />);
    expect(screen.getByRole("dialog", { name: "Confirm operation" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close", exact: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it.each(["default", "sandbox"] as const)("hides only the built-in button for the %s variant", async (variant) => {
    const user = userEvent.setup();
    render(<Example hideCloseButton variant={variant} />);
    expect(screen.queryByRole("button", { name: "Close", exact: true })).toBeNull();
    expect(screen.getByRole("dialog")).not.toHaveAttribute("hideCloseButton");
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Choose whether to continue.");
    await user.click(screen.getByRole("button", { name: "Cancel operation" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("restores the same default button when visibility changes", () => {
    const { rerender } = render(<Example hideCloseButton />);
    expect(screen.queryByRole("button", { name: "Close", exact: true })).toBeNull();
    rerender(<Example hideCloseButton={false} />);
    expect(screen.getByRole("button", { name: "Close", exact: true })).toBeInTheDocument();
    rerender(<Example hideCloseButton />);
    expect(screen.queryByRole("button", { name: "Close", exact: true })).toBeNull();
  });

  it("does not silently disable Escape when the close button is hidden", async () => {
    const user = userEvent.setup();
    render(<Example hideCloseButton />);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("preserves the caller's Escape guard and an explicit keyboard-operable exit", async () => {
    const user = userEvent.setup();
    const guard = vi.fn((event: KeyboardEvent) => event.preventDefault());
    render(<Example hideCloseButton onEscapeKeyDown={guard} />);
    await user.keyboard("{Escape}");
    expect(guard).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    screen.getByRole("button", { name: "Cancel operation" }).focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("forwards content refs, native attributes and class overrides", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Example ref={ref} hideCloseButton id="operation-dialog" data-example="retained" className="max-w-xl" />);
    const dialog = screen.getByRole("dialog");
    expect(ref.current).toBe(dialog);
    expect(dialog).toHaveAttribute("id", "operation-dialog");
    expect(dialog).toHaveAttribute("data-example", "retained");
    expect(dialog).toHaveClass("max-w-xl");
  });
});
