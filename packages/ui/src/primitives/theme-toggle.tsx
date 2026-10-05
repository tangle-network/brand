import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";
type Mode = Exclude<Theme, "system">;

const preferenceEvent = "tangle:theme-preference";
const systemQuery = "(prefers-color-scheme: dark)";
// Only existing, paired Brand themes. Never turn an arbitrary product identity
// (notably Intelligence) into data-theme="light" or data-theme="dark".
const namedModes = [
  { dark: "aubergine", light: "aubergine-light" },
  { dark: "arena", light: "arena-light" },
  { dark: "tangle-dark", light: "tangle-light" },
  { dark: "agents", light: "agents-light" },
] as const;

// Client-only preference cache also keeps the control usable when storage is
// denied, and lets multiple useTheme consumers share the same preference.
// Server renders ONLY read getServerTheme; no request state is stored here.
let preference: Theme | undefined;

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): Mode {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia(systemQuery).matches ? "dark" : "light";
}

function getServerTheme(): Theme { return "system"; }
function getServerMode(): Mode { return "dark"; }

function readInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem("theme");
    if (isTheme(stored)) return stored;
  } catch { /* Storage is optional, not a prerequisite for changing mode. */ }

  const root = document.documentElement;
  const named = root.getAttribute("data-theme");
  if (named === "light" || named === "dark") return named;
  for (const pair of namedModes) {
    if (named === pair.light) return "light";
    if (named === pair.dark) return "dark";
  }
  if (root.classList.contains("light")) return "light";
  if (root.classList.contains("dark")) return "dark";
  const legacy = root.getAttribute("data-sandbox-theme");
  if (legacy === "vault" || legacy === "dawn") return "light";
  return "system";
}

function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return preference ??= readInitialTheme();
}

function applyMode(mode: Mode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  const named = root.getAttribute("data-theme");
  if (named === "dark" || named === "light") {
    root.setAttribute("data-theme", mode);
  } else {
    const pair = namedModes.find((pair) => named === pair.dark || named === pair.light);
    if (pair) root.setAttribute("data-theme", pair[mode]);
  }
}

function setTheme(next: Theme) {
  if (!isTheme(next) || typeof window === "undefined") return;
  preference = next;
  try {
    if (next === "system") window.localStorage.removeItem("theme");
    else window.localStorage.setItem("theme", next);
  } catch { /* Keep the in-memory preference when storage is unavailable. */ }
  applyMode(next === "system" ? getSystemTheme() : next);
  window.dispatchEvent(new Event(preferenceEvent));
}

function subscribeTheme(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== "theme" && event.key !== null) return;
    preference = isTheme(event.newValue) ? event.newValue : "system";
    notify();
  };
  window.addEventListener(preferenceEvent, notify);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(preferenceEvent, notify);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeSystem(notify: () => void) {
  if (!window.matchMedia) return () => {};
  const media = window.matchMedia(systemQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  const system = useSyncExternalStore(subscribeSystem, getSystemTheme, getServerMode);
  const resolvedTheme = theme === "system" ? system : theme;
  useEffect(() => {
    // Hydration first renders the stable server snapshot. Apply the real client
    // preference, not that placeholder, so we never repaint a persisted light
    // page dark while React is catching up.
    const selected = getTheme();
    applyMode(selected === "system" ? getSystemTheme() : selected);
  }, [resolvedTheme]);
  return { theme, setTheme, resolvedTheme };
}

const iconClass = "h-4 w-4";

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden="true"
    >
      <circle cx={12} cy={12} r={5} />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
