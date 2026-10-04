import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

function ToastTrigger({ title, duration }: { title: string; duration?: number }) {
  const { toast } = useToast();

  return (
    <button type="button" onClick={() => toast({ title, duration })}>
      Show {title}
    </button>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ToastProvider auto-dismiss", () => {
  it("cancels every pending dismissal on unmount without updating after teardown", () => {
    const view = render(
      <ToastProvider>
        <ToastTrigger title="First" duration={1000} />
        <ToastTrigger title="Second" duration={2000} />
      </ToastProvider>,
    );
    const scheduleTimeout = globalThis.setTimeout;
    const timeoutFired = vi.fn();
    // Observe the real dismissal callbacks without mocking the provider or React state.
    vi.spyOn(globalThis, "setTimeout").mockImplementation((callback, delay, ...args) =>
      scheduleTimeout(() => {
        timeoutFired();
        callback(...args);
      }, delay),
    );

    fireEvent.click(screen.getByRole("button", { name: "Show First" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Second" }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(2);

    view.unmount();
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // A cancelled callback cannot reach dismiss() or its state update after unmount.
    expect(timeoutFired).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps a toast until its duration elapses, then removes it", () => {
    render(
      <ToastProvider>
        <ToastTrigger title="Saved" duration={1000} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show Saved" }));
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Saved");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears only the manually dismissed toast's timer", () => {
    render(
      <ToastProvider>
        <ToastTrigger title="First" duration={1000} />
        <ToastTrigger title="Second" duration={2000} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show First" }));
    fireEvent.click(screen.getByRole("button", { name: "Show Second" }));
    expect(vi.getTimerCount()).toBe(2);

    fireEvent.click(within(screen.getAllByRole("alert")[0]!).getByRole("button", {
      name: "Dismiss notification",
    }));
    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Second");
    expect(vi.getTimerCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Second");

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("schedules no timer when duration is zero", () => {
    render(
      <ToastProvider>
        <ToastTrigger title="Persistent" duration={0} />
      </ToastProvider>,
    );
    const scheduleTimeout = vi.spyOn(globalThis, "setTimeout");

    fireEvent.click(screen.getByRole("button", { name: "Show Persistent" }));
    expect(scheduleTimeout).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Persistent");
    expect(vi.getTimerCount()).toBe(0);
  });
});
