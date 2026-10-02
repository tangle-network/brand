import * as React from "react";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input, Textarea } from "./input";
import { Label } from "./label";

afterEach(cleanup);

describe.each([
  ["Input", Input],
  ["Textarea", Textarea],
] as const)("%s relationships", (_name, Field) => {
  it("gives repeated labels distinct, stable IDs and focuses the correct field", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<><Field label="Name" /><Field label="Name" /></>);
    const fields = screen.getAllByRole("textbox");
    const ids = fields.map((field) => field.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(2);
    expect(screen.getAllByLabelText("Name")).toEqual(fields);
    for (const [index, label] of screen.getAllByText("Name", { selector: "label" }).entries()) {
      expect(label).toHaveAttribute("for", ids[index]);
      await user.click(label);
      expect(fields[index]).toHaveFocus();
    }
    rerender(<><Field label="Renamed" /><Field label="Renamed" /></>);
    expect(screen.getAllByRole("textbox").map((field) => field.id)).toEqual(ids);
  });

  it("preserves an explicit ID and merges caller, hint and error descriptions without duplicates", () => {
    render(<>
      <p id="external">External instructions.</p>
      <Field
        id="profile"
        label="Name"
        hint="Use your full name."
        error="Name is required."
        aria-describedby={" external  external\tprofile-hint "}
        aria-invalid={false}
      />
    </>);
    const field = screen.getByRole("textbox", { name: "Name" });
    expect(field).toHaveAttribute("id", "profile");
    expect(field).toHaveAttribute("aria-describedby", "external profile-hint profile-error");
    expect(screen.getByText("Use your full name.")).toHaveAttribute("id", "profile-hint");
    expect(screen.getByText("Name is required.")).toHaveAttribute("id", "profile-error");
    expect(field).toHaveAccessibleDescription("External instructions. Use your full name. Name is required.");
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("associates descriptions without a convenience label and removes stale relationships", () => {
    const { rerender } = render(<Field aria-label="Name" hint="A hint" error="An error" />);
    const field = screen.getByRole("textbox", { name: "Name" });
    const id = field.id;
    expect(id).not.toBe("");
    expect(field).toHaveAccessibleDescription("A hint An error");
    rerender(<Field aria-label="Name" hint="A hint" />);
    expect(field.id).toBe(id);
    expect(field).toHaveAttribute("aria-describedby", `${id}-hint`);
    expect(field).not.toHaveAttribute("aria-invalid");
    expect(document.getElementById(`${id}-error`)).toBeNull();
    rerender(<Field aria-label="Name" />);
    const bareField = screen.getByRole("textbox", { name: "Name" });
    expect(bareField.id).toBe(id);
    expect(bareField).not.toHaveAttribute("aria-describedby");
    expect(document.getElementById(`${id}-hint`)).toBeNull();
  });

  it("preserves the bare-element API and caller invalid states", () => {
    const { container, rerender } = render(
      <Field aria-label="Name" aria-describedby="external" aria-invalid="spelling" className="caller-class" />,
    );
    const field = screen.getByRole("textbox");
    expect(container.firstElementChild).toBe(field);
    expect(container.childElementCount).toBe(1);
    expect(field).toHaveAttribute("aria-describedby", "external");
    expect(field).toHaveAttribute("aria-invalid", "spelling");
    expect(field).toHaveClass("caller-class");
    rerender(<Field aria-label="Name" aria-invalid={false} />);
    expect(field).toHaveAttribute("aria-invalid", "false");
  });

  it("uses the existing Label treatment", () => {
    render(<><Label className="block">Reference</Label><Field label="Name" /></>);
    expect(screen.getByText("Name", { selector: "label" }).className)
      .toBe(screen.getByText("Reference").className);
  });
});

it("keeps Input and Textarea IDs distinct even with the same label", () => {
  render(<><Input label="Notes" /><Textarea label="Notes" /></>);
  expect(new Set(screen.getAllByRole("textbox").map((field) => field.id)).size).toBe(2);
});

it("exposes Input's error variant without requiring error text", () => {
  render(<Input aria-label="Name" variant="error" />);
  expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
});

it("forwards native field refs, values and change handlers", async () => {
  const user = userEvent.setup();
  const inputRef = React.createRef<HTMLInputElement>();
  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const inputChange = vi.fn();
  const textareaChange = vi.fn();
  const { unmount } = render(<>
    <Input ref={inputRef} label="Name" defaultValue="A" onChange={inputChange} />
    <Textarea ref={textareaRef} label="Notes" defaultValue="B" onChange={textareaChange} />
  </>);
  expect(inputRef.current).toBe(screen.getByRole("textbox", { name: "Name" }));
  expect(textareaRef.current).toBe(screen.getByRole("textbox", { name: "Notes" }));
  await user.type(inputRef.current!, "lice");
  await user.type(textareaRef.current!, "ody");
  expect(inputRef.current).toHaveValue("Alice");
  expect(textareaRef.current).toHaveValue("Body");
  expect(inputChange).toHaveBeenCalled();
  expect(textareaChange).toHaveBeenCalled();
  unmount();
  expect(inputRef.current).toBeNull();
  expect(textareaRef.current).toBeNull();
});

it("hydrates SSR IDs and all description relationships without mismatch", async () => {
  const ui = <React.StrictMode>
    <p id="external">External instructions.</p>
    <Input label="Name" hint="First hint" />
    <Input label="Name" error="Required" />
    <Textarea label="Name" hint="Notes hint" error="Too short" aria-describedby="external" />
    <Input id="explicit" label="Explicit" hint="Explicit hint" />
  </React.StrictMode>;
  const container = document.createElement("div");
  container.innerHTML = renderToString(ui, { identifierPrefix: "fields-" });
  document.body.appendChild(container);
  const serverHTML = container.innerHTML;
  const serverIds = within(container).getAllByRole("textbox").map((field) => field.id);
  const recoverableError = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, ui, { identifierPrefix: "fields-", onRecoverableError: recoverableError });
    });
    expect(new Set(serverIds).size).toBe(4);
    expect(within(container).getAllByRole("textbox").map((field) => field.id)).toEqual(serverIds);
    expect(container.innerHTML).toBe(serverHTML);
    for (const field of within(container).getAllByRole("textbox")) {
      for (const id of field.getAttribute("aria-describedby")!.split(" ")) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    }
    expect(recoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    await act(async () => { root?.unmount(); });
    consoleError.mockRestore();
    container.remove();
  }
});
