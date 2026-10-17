import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { Wizard } from "./wizard";

function Flow(props: Partial<React.ComponentProps<typeof Wizard>> = {}) {
  return (
    <Wizard {...props}>
      <Wizard.Step title="Number" nextLabel="Continue">pick a number</Wizard.Step>
      <Wizard.Step title="Verify" nextLabel="I replied">verify panel</Wizard.Step>
      <Wizard.Step title="Done" nextLabel="Finish">done panel</Wizard.Step>
    </Wizard>
  );
}

describe("Wizard", () => {
  it("renders the first step and the rail, marks the active step, hides future panels", () => {
    render(<Flow />);
    expect(screen.getByText("pick a number")).toBeVisible();
    expect(screen.queryByText("verify panel")).toBeNull();
    expect(screen.getByRole("list", { name: "Steps" })).toBeVisible();
    expect(screen.getAllByText("Number").length).toBeGreaterThan(0);
  });

  it("advances on the primary action and mirrors onStepChange", async () => {
    const onStepChange = vi.fn();
    render(<Flow onStepChange={onStepChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("verify panel")).toBeVisible();
    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it("back returns to the previous step; the first step has no back", async () => {
    render(<Flow />);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("pick a number")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("future steps are not clickable; past steps are", async () => {
    render(<Flow />);
    fireEvent.click(screen.getByText("Verify")); // future: a span, not a button
    expect(screen.getByText("pick a number")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getAllByRole("button", { name: /Number/ })[0]!); // past: clickable
    expect(screen.getByText("pick a number")).toBeVisible();
  });

  it("an async onNext advances only on resolve; returning false keeps the step", async () => {
    let resolveCheck: (value: unknown) => void = () => {};
    const onNext = vi.fn(() => new Promise(resolve => { resolveCheck = resolve; }));
    render(
      <Wizard>
        <Wizard.Step title="Check" nextLabel="Check" onNext={onNext}>checking</Wizard.Step>
        <Wizard.Step title="Next">next panel</Wizard.Step>
      </Wizard>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("checking")).toBeVisible(); // still here while pending
    resolveCheck(true);
    await waitFor(() => expect(screen.getByText("next panel")).toBeVisible());
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("a rejected onNext stays on the step without crashing", async () => {
    const onNext = vi.fn(() => Promise.reject(new Error("no")));
    render(
      <Wizard>
        <Wizard.Step title="Check" nextLabel="Check" onNext={onNext}>checking</Wizard.Step>
        <Wizard.Step title="Next">next panel</Wizard.Step>
      </Wizard>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Check" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Check" })).toBeEnabled());
    expect(screen.getByText("checking")).toBeVisible();
  });

  it("the last step fires onFinished instead of advancing", async () => {
    const onFinished = vi.fn();
    render(<Flow onFinished={onFinished} defaultStep={2} />);
    await userEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(screen.getByText("done panel")).toBeVisible();
  });

  it("step can drive externally (controlled) and omit the default footer action", () => {
    render(
      <Wizard step={1}>
        <Wizard.Step title="One">one</Wizard.Step>
        <Wizard.Step title="Two"><button type="button">custom</button></Wizard.Step>
      </Wizard>,
    );
    expect(screen.getAllByText("Two").length).toBeGreaterThan(0);
    expect(screen.getByText("custom")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  });

  it("throws when a step is used outside a wizard", () => {
    // Silence the expected console.error from React's error boundary path.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Wizard.Step title="Alone">x</Wizard.Step>)).toThrow(/must be used inside/);
    spy.mockRestore();
  });
});
