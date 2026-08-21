import { fireEvent, render, screen } from "@testing-library/react";
import { Component, type ReactNode, Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retryableLazyEditor } from "./editor-lazy";
import { MissingEditorPeersError } from "./editor-peers";

/** Catches the rejection the lazy component throws, and can mount it again. */
class ResettableBoundary extends Component<
  { children: ReactNode },
  { failure: Error | null }
> {
  state = { failure: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { failure: error };
  }

  render() {
    if (this.state.failure) {
      return (
        <button type="button" onClick={() => this.setState({ failure: null })}>
          failed: {this.state.failure.message}
        </button>
      );
    }
    return this.props.children;
  }
}

function Loaded() {
  return <span>editor</span>;
}

/** React reports a caught render error on the console; the assertions read it. */
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

function renderRetryable(load: () => Promise<typeof Loaded>) {
  const lazyEditor = retryableLazyEditor(load);
  function Host() {
    const LazyEditor = lazyEditor();
    return (
      <Suspense fallback={<span>loading</span>}>
        <LazyEditor />
      </Suspense>
    );
  }
  return render(
    <ResettableBoundary>
      <Host />
    </ResettableBoundary>,
  );
}

describe("retryableLazyEditor", () => {
  it("re-attempts the load after a transient failure", async () => {
    // `lazy` caches its first rejection for the life of the component, so one
    // failed chunk fetch would otherwise hold the editor broken until a full
    // page reload.
    const load = vi
      .fn<() => Promise<typeof Loaded>>()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"))
      .mockResolvedValue(Loaded);

    renderRetryable(load);

    const retry = await screen.findByRole("button");
    expect(retry).toHaveTextContent("Failed to fetch dynamically imported module");
    expect(load).toHaveBeenCalledTimes(1);

    fireEvent.click(retry);

    expect(await screen.findByText("editor")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps a missing peer permanent, so a remount does not import it again", async () => {
    // A package does not install itself mid-session. Retrying would only
    // repeat the same failure and hide the install list behind a loop.
    const load = vi
      .fn<() => Promise<typeof Loaded>>()
      .mockRejectedValue(new MissingEditorPeersError("Install @tiptap/react."));

    renderRetryable(load);

    const retry = await screen.findByRole("button");
    expect(retry).toHaveTextContent("Install @tiptap/react.");
    expect(load).toHaveBeenCalledTimes(1);

    fireEvent.click(retry);

    expect(await screen.findByRole("button")).toHaveTextContent("Install @tiptap/react.");
    expect(load).toHaveBeenCalledTimes(1);
  });
});
