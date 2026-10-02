import * as React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

describe.each(["disabled", "loading"] as const)("%s controls", (state) => {
  it.each([false, true])("natively disables button elements (asChild=%s)", async (asChild) => {
    const user = userEvent.setup();
    const click = vi.fn();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}>
      <Button {...{ [state]: true }} asChild={asChild} onClick={click}>
        {asChild ? <button disabled={false} aria-busy={false}>Save</button> : "Save"}
      </Button>
      <input aria-label="Next field" />
    </form>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName("Save");
    if (state === "loading") expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    button.click();
    button.focus();
    expect(button).not.toHaveFocus();
    await user.keyboard("{Enter} ");
    expect(click).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    await user.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("blocks slotted anchor activation before child AND slot capture/bubble handlers", async () => {
    const user = userEvent.setup();
    const activation = vi.fn();
    const handlers = {
      onClick: activation, onClickCapture: activation,
      onAuxClick: activation, onAuxClickCapture: activation,
      onDoubleClick: activation, onDoubleClickCapture: activation,
      onPointerDown: activation, onPointerDownCapture: activation,
      onPointerUp: activation, onPointerUpCapture: activation,
      onMouseDown: activation, onMouseDownCapture: activation,
      onMouseUp: activation, onMouseUpCapture: activation,
      onKeyDown: activation, onKeyDownCapture: activation,
      onKeyUp: activation, onKeyUpCapture: activation,
    };
    render(<div onClick={activation}>
      <Button asChild {...{ [state]: true }} aria-busy={false} {...handlers}>
        <a href="#destination" tabIndex={0} aria-disabled={false} aria-busy={false} {...handlers}>
          <span>Open account</span>
        </a>
      </Button>
      <button>Next action</button>
    </div>);
    const link = screen.getByRole("link", { name: "Open account" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    expect(link).not.toHaveAttribute("disabled");
    expect(link).not.toHaveAttribute("href");
    if (state === "loading") expect(link).toHaveAttribute("aria-busy", "true");
    const target = screen.getByText("Open account");
    expect(fireEvent.click(target)).toBe(false);
    expect(fireEvent.doubleClick(target)).toBe(false);
    expect(fireEvent(target, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }))).toBe(false);
    expect(fireEvent.pointerDown(target)).toBe(false);
    expect(fireEvent.pointerUp(target)).toBe(false);
    expect(fireEvent.mouseDown(target)).toBe(false);
    expect(fireEvent.mouseUp(target)).toBe(false);
    for (const key of ["Enter", " "]) {
      expect(fireEvent.keyDown(link, { key })).toBe(false);
      expect(fireEvent.keyUp(link, { key })).toBe(false);
    }
    await user.click(target);
    link.click();
    // Even programmatically focused, a disabled link cannot activate by keyboard.
    link.focus();
    await user.keyboard("{Enter} ");
    expect(activation).not.toHaveBeenCalled();
    link.blur();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next action" })).toHaveFocus();
  });
});

it("retains the action name and hides the reduced-motion spinner from accessibility", () => {
  const { rerender } = render(<Button loading aria-busy={false}>Save changes</Button>);
  const button = screen.getByRole("button", { name: "Save changes" });
  expect(button).toHaveAttribute("aria-busy", "true");
  const spinner = button.querySelector("svg");
  expect(spinner).toHaveAttribute("aria-hidden", "true");
  expect(spinner).toHaveAttribute("focusable", "false");
  expect(spinner).toHaveClass("motion-reduce:animate-none");
  expect(button).toHaveClass("motion-reduce:transition-none", "motion-reduce:active:scale-100");
  expect(button.querySelector("title")).toBeNull();
  rerender(<Button loading size="icon" aria-label="Refresh reports"><span aria-hidden="true">↻</span></Button>);
  expect(screen.getByRole("button")).toHaveAccessibleName("Refresh reports");
});

it.each(["disabled", "loading"] as const)("restores link attributes and original Slot handler order when %s ends", async (state) => {
  const user = userEvent.setup();
  const calls: string[] = [];
  const ui = (unavailable: boolean) => <Button asChild {...{ [state]: unavailable }} onClick={() => calls.push("slot")}>
    <a href="#destination" tabIndex={2} onClick={(event) => { event.preventDefault(); calls.push("child"); }}>Open</a>
  </Button>;
  const { rerender } = render(ui(true));
  const link = screen.getByRole("link");
  rerender(ui(false));
  expect(link).toHaveAttribute("href", "#destination");
  expect(link).toHaveAttribute("tabindex", "2");
  expect(link).not.toHaveAttribute("aria-disabled");
  expect(link).not.toHaveAttribute("aria-busy");
  expect(link).not.toHaveAttribute("role");
  await user.click(link);
  expect(calls).toEqual(["child", "slot"]);
  calls.length = 0;
  link.focus();
  await user.keyboard("{Enter}");
  expect(calls).toEqual(["child", "slot"]);
});

it("preserves non-activation keyboard handlers on disabled links", () => {
  const calls: string[] = [];
  render(<Button asChild disabled onKeyDownCapture={() => calls.push("slot capture")} onKeyDown={() => calls.push("slot bubble")}>
    <a href="#destination" onKeyDownCapture={() => calls.push("child capture")} onKeyDown={() => calls.push("child bubble")}>Open</a>
  </Button>);
  expect(fireEvent.keyDown(screen.getByRole("link"), { key: "ArrowRight" })).toBe(true);
  expect(calls).toEqual(["child capture", "slot capture", "child bubble", "slot bubble"]);
});

it("respects a native child's own disabled state", () => {
  render(<Button asChild disabled={false}><button disabled>Save</button></Button>);
  expect(screen.getByRole("button")).toBeDisabled();
});

it("composes refs on a slotted native button", () => {
  const outerRef = React.createRef<HTMLButtonElement>();
  const childRef = React.createRef<HTMLButtonElement>();
  const { unmount } = render(<Button asChild ref={outerRef}><button ref={childRef}>Save</button></Button>);
  expect(outerRef.current).toBe(screen.getByRole("button"));
  expect(childRef.current).toBe(outerRef.current);
  unmount();
  expect(outerRef.current).toBeNull();
  expect(childRef.current).toBeNull();
});

it("preserves caller busy state when Button is not loading", () => {
  render(<><Button aria-busy>Save</Button><Button asChild aria-busy><a href="#destination">Open</a></Button></>);
  expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("link")).toHaveAttribute("aria-busy", "true");
});

it("preserves implicit submission, explicit types, and enabled keyboard activation", async () => {
  const user = userEvent.setup();
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  render(<form onSubmit={submit}>
    <Button>Implicit submit</Button>
    <Button asChild><button>Slotted submit</button></Button>
    <Button type="button">Explicit button</Button>
    <Button type="submit">Explicit submit</Button>
    <Button asChild type="submit"><button type="button">Child button</button></Button>
  </form>);
  const implicit = screen.getByRole("button", { name: "Implicit submit" });
  expect(implicit).not.toHaveAttribute("type");
  await user.click(implicit);
  await user.click(screen.getByRole("button", { name: "Slotted submit" }));
  await user.click(screen.getByRole("button", { name: "Explicit submit" }));
  expect(submit).toHaveBeenCalledTimes(3);
  await user.click(screen.getByRole("button", { name: "Explicit button" }));
  await user.click(screen.getByRole("button", { name: "Child button" }));
  expect(submit).toHaveBeenCalledTimes(3);
  implicit.focus();
  await user.keyboard("{Enter} ");
  expect(submit).toHaveBeenCalledTimes(5);
});

it("forwards native refs and composes both refs on a slotted anchor", () => {
  const nativeRef = React.createRef<HTMLButtonElement>();
  const anchorRef = React.createRef<HTMLAnchorElement>();
  const slotRef = vi.fn();
  const { rerender, unmount } = render(<>
    <Button ref={nativeRef}>Save</Button>
    <Button asChild loading ref={slotRef}><a ref={anchorRef} href="#destination">Open</a></Button>
  </>);
  const link = screen.getByRole("link");
  expect(nativeRef.current).toBe(screen.getByRole("button"));
  expect(anchorRef.current).toBe(link);
  expect(slotRef).toHaveBeenLastCalledWith(link);
  rerender(<>
    <Button ref={nativeRef}>Save</Button>
    <Button asChild ref={slotRef}><a ref={anchorRef} href="#destination">Open</a></Button>
  </>);
  expect(anchorRef.current).toBe(link);
  expect(slotRef).toHaveBeenLastCalledWith(link);
  unmount();
  expect(nativeRef.current).toBeNull();
  expect(anchorRef.current).toBeNull();
  expect(slotRef).toHaveBeenLastCalledWith(null);
});

it("hydrates disabled/loading native and slotted controls without changing their names", async () => {
  const ui = <>
    <Button loading>Save</Button>
    <Button asChild loading><button>Submit</button></Button>
    <Button asChild disabled><a href="#destination">Open</a></Button>
  </>;
  const container = document.createElement("div");
  container.innerHTML = renderToString(ui);
  document.body.appendChild(container);
  const html = container.innerHTML;
  const recoverableError = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  let root: Root | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, ui, { onRecoverableError: recoverableError }); });
    expect(container.innerHTML).toBe(html);
    expect(within(container).getByRole("button", { name: "Save" })).toBeDisabled();
    expect(within(container).getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(within(container).getByRole("link", { name: "Open" })).not.toHaveAttribute("href");
    expect(recoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    await act(async () => { root?.unmount(); });
    consoleError.mockRestore();
    container.remove();
  }
});
