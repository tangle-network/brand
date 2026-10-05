import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let ThemeToggle: typeof import("./theme-toggle").ThemeToggle;
let useTheme: typeof import("./theme-toggle").useTheme;
let dark = false;
let listeners: Set<() => void>;

beforeEach(async () => {
  vi.resetModules();
  for (const attr of ["class", "data-theme", "data-sandbox-theme"]) document.documentElement.removeAttribute(attr);
  window.localStorage.clear();
  dark = false;
  listeners = new Set();
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    get matches() { return dark; },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, handler: () => void) => listeners.add(handler),
    removeEventListener: (_: string, handler: () => void) => listeners.delete(handler),
  })));
  ({ ThemeToggle, useTheme } = await import("./theme-toggle"));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const attr of ["class", "data-theme", "data-sandbox-theme"]) document.documentElement.removeAttribute(attr);
});

function systemMode(next: boolean) {
  act(() => { dark = next; listeners.forEach((notify) => notify()); });
}

function PreferenceControl() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return <button onClick={() => setTheme("system")}>{theme}:{resolvedTheme}</button>;
}

describe("root mode preference", () => {
  it("tracks system changes in the DOM, icon label and click behavior", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
    expect(document.documentElement.classList.contains("light")).toBe(true);
    systemMode(true);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(window.localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.className).toBe("light");
    systemMode(false); systemMode(true);
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
  });

  it("shares explicit choices and a return to system across mounted consumers", () => {
    window.localStorage.setItem("theme", "dark");
    render(<><ThemeToggle /><PreferenceControl /></>);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(screen.getByRole("button", { name: "light:light" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "light:light" }));
    expect(window.localStorage.getItem("theme")).toBeNull();
    systemMode(true);
    expect(screen.getByRole("button", { name: "system:dark" })).toBeTruthy();
  });

  it("remains usable when storage reads, writes and removals throw", () => {
    for (const method of ["getItem", "setItem", "removeItem"] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error("denied"); });
    }
    render(<><ThemeToggle /><PreferenceControl /></>);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(screen.getByRole("button", { name: "dark:dark" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "dark:dark" }));
    expect(screen.getByRole("button", { name: "system:light" })).toBeTruthy();
  });

  it("ignores invalid stored values and handles cross-tab preference changes", () => {
    window.localStorage.setItem("theme", "not-a-theme");
    render(<ThemeToggle />);
    expect(document.documentElement.className).toBe("light");
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: "dark" })));
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: null })));
    expect(document.documentElement.className).toBe("light");
  });

  it.each(["light", "dark"])("honors explicit data-theme=%s and keeps it in sync", (mode) => {
    document.documentElement.dataset.theme = mode;
    dark = mode !== "dark";
    render(<ThemeToggle />);
    expect(document.documentElement.className).toBe(mode);
    fireEvent.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe(mode === "light" ? "dark" : "light");
  });

  it.each(["light", "dark"])("honors an explicit .%s class without a saved preference", (mode) => {
    document.documentElement.className = mode;
    dark = mode !== "dark";
    render(<ThemeToggle />);
    expect(document.documentElement.className).toBe(mode);
  });

  it.each([
    ["aubergine", "aubergine-light"], ["arena", "arena-light"], ["tangle-dark", "tangle-light"],
    ["agents", "agents-light"],
  ])("keeps the %s named family in both directions", (name, lightName) => {
    document.documentElement.dataset.theme = name;
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement.dataset.theme).toBe(lightName);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement.dataset.theme).toBe(name);
  });

  it.each(["intelligence", "custom-product"])("does not overwrite unpaired identity %s", (name) => {
    document.documentElement.dataset.theme = name;
    document.documentElement.className = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(document.documentElement.dataset.theme).toBe(name);
    expect(document.documentElement.className).toBe("light");
  });

  it.each(["vault", "dawn"])("preserves legacy %s identity while changing mode", (name) => {
    document.documentElement.dataset.sandboxTheme = name;
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(document.documentElement.dataset.sandboxTheme).toBe(name);
    expect(document.documentElement.className).toBe("dark");
  });

  it("uses the dark fallback without matchMedia and cleans subscriptions on unmount", () => {
    const view = render(<ThemeToggle />);
    expect(listeners.size).toBe(1);
    view.unmount();
    expect(listeners.size).toBe(0);
    vi.stubGlobal("matchMedia", undefined);
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy();
  });
});

describe("server rendering and hydration", () => {
  it("renders without window, document, matchMedia or storage", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    expect(renderToString(<ThemeToggle />)).toContain("Switch to light mode");
    vi.unstubAllGlobals();
  });

  it("hydrates the server snapshot then resolves saved light without a dark write", async () => {
    const html = renderToString(<ThemeToggle />);
    window.localStorage.setItem("theme", "light");
    document.documentElement.className = "light";
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const recoverable = vi.fn();
    const toggle = vi.spyOn(document.documentElement.classList, "toggle");
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(host, <ThemeToggle />, { onRecoverableError: recoverable }); });
    expect(host.querySelector("button")?.getAttribute("aria-label")).toBe("Switch to dark mode");
    expect(recoverable).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalledWith("dark", true);
    await act(async () => root.unmount());
    host.remove();
  });
});
