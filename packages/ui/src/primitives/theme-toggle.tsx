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
  { dark: "super", light: "super-light" },
  { dark: "tangle-dark", light: "tangle-light" },
  { dark: "agents", light: "agents-light" },
] as const;

export interface ThemeControllerOptions {
  storageKey?: string;
  defaultTheme?: Theme;
  /** Persisted spellings, including null to remove a system preference. */
  storageValues?: Partial<Record<Theme, string | null>>;
  /** Product mode attribute; absent mode values remove the attribute. */
  attribute?: { name: string; light?: string; dark?: string };
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): Mode {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia(systemQuery).matches ? "dark" : "light";
}

function subscribeSystem(notify: () => void) {
  if (!window.matchMedia) return () => {};
  const media = window.matchMedia(systemQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** Create once at module scope. Each product owns its persisted names, not a second theme engine. */
export function createThemeController({ storageKey = "theme", defaultTheme = "system", storageValues, attribute }: ThemeControllerOptions = {}) {
  const values = { light: "light", dark: "dark", system: null, ...storageValues };
  const eventName = `${preferenceEvent}:${storageKey}`;
  // Client-only cache keeps storage-denied controls usable. SSR never writes it.
  let preference: Theme | undefined;
  const decode = (value: string | null): Theme =>
    (Object.keys(values) as Theme[]).find(theme => value !== null && values[theme] === value) ??
    (value === "system" && values.system === null ? "system" : defaultTheme);
  const serverTheme = () => defaultTheme;
  const serverMode = (): Mode => defaultTheme === "system" ? "dark" : defaultTheme;
  function readInitialTheme(): Theme {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null && (Object.values(values).includes(stored) || (stored === "system" && values.system === null))) return decode(stored);
    } catch { /* Storage is optional. */ }
    if (attribute || defaultTheme !== "system") return defaultTheme;
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
    return legacy === "vault" || legacy === "dawn" ? "light" : defaultTheme;
  }
  function getTheme(): Theme {
    if (typeof window === "undefined") return defaultTheme;
    return preference ??= readInitialTheme();
  }
  /** Apply a temporary page mode without overwriting the user's preference. */
  function applyTheme(theme: Theme = getTheme()) {
    if (typeof document === "undefined") return;
    const mode = theme === "system" ? getSystemTheme() : theme;
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", !attribute && mode === "light");
    if (attribute) {
      const value = attribute[mode];
      if (value === undefined) root.removeAttribute(attribute.name);
      else root.setAttribute(attribute.name, value);
    } else {
      const named = root.getAttribute("data-theme");
      if (named === "dark" || named === "light") root.setAttribute("data-theme", mode);
      else {
        const pair = namedModes.find(pair => named === pair.dark || named === pair.light);
        if (pair) root.setAttribute("data-theme", pair[mode]);
      }
    }
  }
  function setTheme(next: Theme) {
    if (!isTheme(next) || typeof window === "undefined") return;
    preference = next;
    try {
      const value = values[next];
      if (value === null) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, value);
    } catch { /* Keep the in-memory preference when storage is unavailable. */ }
    applyTheme(next);
    window.dispatchEvent(new CustomEvent(eventName, { detail: next }));
  }
  function subscribeTheme(notify: () => void) {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      preference = decode(event.newValue);
      notify();
    };
    const onPreference = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      if (isTheme(next)) preference = next;
      notify();
    };
    window.addEventListener(eventName, onPreference);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(eventName, onPreference);
      window.removeEventListener("storage", onStorage);
    };
  }
  function useTheme() {
    const theme = useSyncExternalStore(subscribeTheme, getTheme, serverTheme);
    const system = useSyncExternalStore(subscribeSystem, getSystemTheme, serverMode);
    const resolvedTheme = theme === "system" ? system : theme;
    useEffect(() => { applyTheme(getTheme()); }, [resolvedTheme]);
    return { theme, setTheme, resolvedTheme };
  }
  return { useTheme, getTheme, setTheme, applyTheme };
}

export const { useTheme } = createThemeController();

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
