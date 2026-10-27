/** React-free presentation. Consumers scan this published source with Tailwind. */
import { surfaceMotion } from "./lib/motion";
import { cva } from "class-variance-authority";
import { controlHeight, controlMotion, controlRadius, controlSizes, controlSquare, controlText, fieldPresentation, fieldSizes, fieldTouchText, touchTarget } from "./lib/control-presentation";
import { focusRing, focusFieldInvalid } from "./lib/focus";
import { ixControl, ixControlSoft, ixSelected, ixTabUnderline } from "./lib/interaction";
import { cn } from "./lib/utils";
export { controlHeight, controlMotion, controlRadius, controlSizes, controlText, fieldPresentation, fieldSizes, fieldTouchText } from "./lib/control-presentation";

export const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ${controlMotion} ${focusRing} disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default:
          `bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] ${ixControl}`,
        destructive:
          `bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97] ${ixControl}`,
        outline:
          `border border-border bg-card hover:bg-muted active:scale-[0.97] text-foreground ${ixControl}`,
        "destructive-outline":
          `border border-[var(--surface-danger-border)] bg-card hover:bg-[var(--surface-danger-bg)] active:scale-[0.97] text-[var(--surface-danger-text)] ${ixControl}`,
        secondary:
          `bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-[0.97] ${ixControl}`,
        ghost:
          `hover:text-foreground text-muted-foreground border border-transparent ${ixControlSoft}`,
        link: `text-[var(--accent-text)] underline-offset-4 hover:underline ${ixControlSoft}`,
        sandbox:
          `bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border-accent)] hover:bg-[var(--btn-primary-hover)] active:scale-[0.97] ${ixControl}`,
      },
      size: {
        default: `${controlHeight.md} ${controlText.md} ${controlRadius.md} ${touchTarget} px-4 py-2`,
        md: `${controlHeight.md} ${controlText.md} ${controlRadius.md} ${touchTarget} px-4 py-2`,
        sm: `${controlHeight.sm} ${controlText.sm} ${controlRadius.sm} ${touchTarget} px-3`,
        lg: `${controlHeight.lg} ${controlText.lg} ${controlRadius.lg} ${touchTarget} px-7`,
        display: "tangle-control-display",
        xl: "h-13 rounded-xl px-9 text-base",
        icon: `${controlSquare.md} ${controlText.md} ${controlRadius.md} ${touchTarget}`,
        "icon-sm": `${controlSquare.sm} ${controlText.sm} ${controlRadius.sm} ${touchTarget}`,
        "icon-lg": `${controlSquare.lg} ${controlText.lg} ${controlRadius.lg} ${touchTarget}`,
        ...controlSizes,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export const inputVariants = cva(
  cn(
    "flex w-full border py-1 placeholder:text-[var(--text-dim)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:font-medium",
    fieldPresentation,
    fieldTouchText,
  ),
  {
    variants: {
      // `default` and `sandbox` render the same field; both names stay valid.
      variant: {
        default: "",
        sandbox: "",
        error: focusFieldInvalid,
      },
      size: {
        default: fieldSizes.md,
        md: fieldSizes.md,
        sm: fieldSizes.sm,
        lg: fieldSizes.lg,
        compact: cn(fieldSizes.md, controlSizes.compact),
        touch: cn(fieldSizes.md, controlSizes.touch),
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);


export const tablePresentation = {
  root: "w-full caption-bottom text-sm",
  wrapper: "relative w-full overflow-auto",
  head: "[&_tr]:border-b",
  body: "[&_tr:last-child]:border-0",
  footer: "border-t bg-card font-medium [&>tr]:last:border-b-0",
  row: `border-border border-b ${controlMotion} hover:bg-muted/50 data-[state=selected]:bg-muted/50`,
  columnHeader: "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
  cell: "p-4 align-middle [&:has([role=checkbox])]:pr-0",
  caption: "mt-4 text-muted-foreground text-sm",
} as const;

export const emptyStatePresentation = {
  root: "flex flex-col items-center justify-center px-4 py-16 text-center",
  icon: "mb-4 rounded-full bg-muted p-4 text-muted-foreground",
  title: "font-semibold text-lg",
  description: "mt-2 max-w-sm text-muted-foreground text-sm",
  action: "mt-6",
} as const;

export const metricPresentation = {
  strip: "grid min-w-0 rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-card)]",
  item: "min-w-0 border-border p-4 sm:p-5",
  value: "mt-1 whitespace-normal [overflow-wrap:anywhere] font-semibold text-xl tabular-nums tracking-tight lg:text-2xl",
  label: "flex min-w-0 flex-wrap items-center gap-2 text-muted-foreground text-sm",
  labelText: "min-w-0 whitespace-normal [overflow-wrap:anywhere]",
  hint: "mt-0.5 whitespace-normal [overflow-wrap:anywhere] text-[var(--text-dim)] text-xs",
} as const;

export const metricLayouts = {
  2: "grid-cols-1 sm:grid-cols-2 max-sm:[&>div+div]:border-t sm:[&>div:not(:nth-child(2n+1))]:border-l",
  3: "grid-cols-2 sm:grid-cols-3 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:[&>div:not(:nth-child(3n+1))]:border-l",
  4: "grid-cols-2 sm:grid-cols-4 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:[&>div:not(:nth-child(4n+1))]:border-l",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l lg:[&>div:not(:nth-child(5n+1))]:border-l",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l lg:[&>div:not(:nth-child(6n+1))]:border-l",
} as const;

/** Hand-rolled SVG charts: every stroke and fill is currentColor against a
 * token class, so ink stays theme-aware with no hardcoded hues. Charts draw
 * lines and text only; the grouping plane (border, surface) is caller-owned. */
export const chartPresentation = {
  sparkline: "h-9 w-full text-primary",
  root: "h-auto w-full",
  axis: "text-muted-foreground",
  gridLine: "opacity-20",
  referenceLine: "opacity-60",
  primarySeries: "text-primary",
  secondarySeries: "text-muted-foreground",
  area: "opacity-10",
} as const;

export const dialogPresentation = {
  overlay: "fixed inset-0 z-50 bg-black/40",
  transition: surfaceMotion,
  position: "fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
  surface: "gap-4 rounded-lg border bg-card p-6 shadow-lg",
  close: `absolute top-4 right-4 rounded-sm opacity-70 ${controlMotion} hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground`,
  header: "flex flex-col space-y-1.5 text-center sm:text-left",
  footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
  title: "font-semibold text-lg leading-none tracking-tight",
  description: "text-muted-foreground text-sm",
} as const;

/** Native-dialog adapter for Hono/static markup. Radix remains the React Dialog/Sheet owner. */
export function bindDialog(dialog: HTMLDialogElement, trigger: HTMLElement): () => void {
  const sync = () => trigger.setAttribute("aria-expanded", String(dialog.open));
  const show = () => { if (!dialog.open) dialog.showModal(); sync(); };
  const close = () => { sync(); trigger.focus(); };
  const click = (event: MouseEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-dialog-close]")) dialog.close();
  };
  // Native modal inertness blocks page controls, but Tab can still visit browser
  // chrome at a boundary. Keep this reading surface's keyboard cycle local.
  const key = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !dialog.open) return;
    const candidates = [...dialog.querySelectorAll<HTMLElement>("*")]
      .filter(element => (element.tabIndex >= 0 || (element.isContentEditable && !element.hasAttribute("tabindex")))
        && !element.matches(":disabled") && !element.closest("[inert]")
        && element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible");
    const radio = (element: Element): element is HTMLInputElement => element instanceof HTMLInputElement && element.type === "radio" && !!element.name;
    const sameRadioGroup = (a: Element, b: Element) => radio(a) && radio(b) && a.name === b.name && a.form === b.form && a.getRootNode() === b.getRootNode();
    const stops = candidates.filter(element => {
      if (!radio(element)) return true;
      const group = candidates.filter(candidate => sameRadioGroup(element, candidate));
      const checked = group.find(candidate => (candidate as HTMLInputElement).checked);
      return element === (checked ?? (event.shiftKey ? group.at(-1) : group[0]));
    }).sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
    const first = stops[0], last = stops.at(-1), active = document.activeElement;
    if (!first) { event.preventDefault(); dialog.focus(); return; }
    const atBoundary = (boundary: HTMLElement) => active === boundary || (active instanceof Element && sameRadioGroup(active, boundary));
    if (active === dialog || (event.shiftKey ? atBoundary(first) : atBoundary(last!))) {
      event.preventDefault(); (event.shiftKey ? last! : first).focus();
    }
  };
  trigger.setAttribute("aria-haspopup", "dialog");
  if (dialog.id) trigger.setAttribute("aria-controls", dialog.id);
  sync();trigger.addEventListener("click",show);dialog.addEventListener("close",close);dialog.addEventListener("click",click);dialog.addEventListener("keydown",key);
  return () => {trigger.removeEventListener("click",show);dialog.removeEventListener("close",close);dialog.removeEventListener("click",click);dialog.removeEventListener("keydown",key);};
}

/**
 * The settings section links of PageShell `measure="settings"`, for any host: PageShell binds its
 * nav with it, and a server-rendered host binds the same markup. On the tab strip the current link
 * (`aria-current="page"`) is centred by scrolling the strip only, never the page. It centres when
 * the current link changes or first becomes reachable, never on scroll or on a change that keeps
 * the same current link, so a user who scrolled to the first or last section stays there; resize
 * and font swaps re-centre only until the user first scrolls the strip. A plain click on a link to
 * another document makes it current at once, while that document loads, and a page restored from
 * the back-forward cache shows the link it left.
 */
export function bindSettingsNav(nav: HTMLElement): () => void {
  let centredKey: string | null = null;
  let userScrolled = false;
  let left: { from: Element | null; to: Element } | null = null;
  const current = () => nav.querySelector<HTMLElement>('[aria-current="page"]');
  const reveal = (layoutOnly: boolean) => {
    const link = current();
    if (nav.scrollWidth <= nav.clientWidth || !link) return;
    const key = link.getAttribute("href") ?? link.textContent ?? "";
    if (key !== centredKey) userScrolled = false;
    else if (!layoutOnly || userScrolled) return;
    centredKey = key;
    const strip = nav.getBoundingClientRect(), box = link.getBoundingClientRect();
    nav.scrollLeft += box.left + box.width / 2 - (strip.left + strip.width / 2);
  };
  const mark = (from: Element | null, to: Element | null) => { from?.removeAttribute("aria-current"); to?.setAttribute("aria-current", "page"); };
  // On window, so it runs after the page's own handlers: a client router that took the click
  // (preventDefault) sets the current link itself.
  const click = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(link instanceof HTMLAnchorElement) || !nav.contains(link) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    if (link.origin !== location.origin || link.pathname + link.search === location.pathname + location.search) return;
    const from = current();
    if (from === link) return;
    left = { from, to: link };
    mark(from, link);
  };
  const restore = (event: PageTransitionEvent) => {
    if (!event.persisted || !left) return;
    mark(left.to, left.from);
    left = null;
  };
  const onUser = () => { userScrolled = true; };
  const userEvents = ["pointerdown", "touchstart", "wheel", "keydown"] as const;
  for (const type of userEvents) nav.addEventListener(type, onUser, { passive: true });
  window.addEventListener("click", click);
  window.addEventListener("pageshow", restore);
  let live = true;
  reveal(false);
  // A web font swap widens the tabs without resizing the strip.
  void document.fonts?.ready.then(() => { if (live) reveal(true); });
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => reveal(true));
  resize?.observe(nav);
  // Links a host replaces (sections loaded later, a new aria-current) can change the current link.
  const links = new MutationObserver(() => reveal(false));
  links.observe(nav, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-current"] });
  return () => {
    live = false;
    resize?.disconnect();
    links.disconnect();
    for (const type of userEvents) nav.removeEventListener(type, onUser);
    window.removeEventListener("click", click);
    window.removeEventListener("pageshow", restore);
  };
}

export const labelVariants = cva(
  "font-medium text-[length:var(--font-size-label,0.875rem)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export const helpPresentation = {
 root: "text-[length:var(--font-size-help,0.75rem)] leading-4",
 error: "font-medium text-[var(--surface-danger-text)]",
 hint: "text-[var(--text-dim)]",
};

export const cardPresentation = {
 root: `rounded-[var(--radius-lg)] border text-card-foreground ${controlMotion}`,
 padding: "p-4",
 variants: {
    default: "bg-card border-border shadow-[var(--edge-highlight),var(--shadow-card)]",
    elevated: "bg-muted/50 border-border shadow-[var(--shadow-card)]",
    glass: "bg-card/80 backdrop-blur-xl border-border shadow-[var(--shadow-card)]",
    sandbox: "bg-muted/50 border-primary/20 shadow-[var(--shadow-accent)]",
  },
} as const;

/** Canonical segmented, pill and underline navigation presentation. */
export const tabsPresentation = {
list: {
    default:
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
    pills: "inline-flex items-center gap-2",
    underline: "inline-flex items-center gap-4 border-b border-border",
  },
trigger: {
    default:
      `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${controlMotion} ${focusRing} disabled:pointer-events-none disabled:opacity-50 ${ixControlSoft} ${ixSelected}`,
    pills:
      `inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${controlMotion} ${focusRing} disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:text-muted-foreground ${ixControlSoft} ${ixSelected}`,
    underline:
      `inline-flex items-center justify-center whitespace-nowrap rounded-t-md pb-3 text-sm font-medium ${controlMotion} ${focusRing} disabled:pointer-events-none disabled:opacity-50 border-b-2 border-transparent data-[state=inactive]:text-muted-foreground ${ixTabUnderline}`,
  }
} as const;
export { ixControlSoft, ixSelected, ixTabUnderline } from "./lib/interaction";
