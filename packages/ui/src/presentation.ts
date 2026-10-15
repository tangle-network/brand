/** React-free presentation. Consumers scan this published source with Tailwind. */
import { surfaceMotion } from "./lib/motion";
import { cva } from "class-variance-authority";
import { controlHeight, controlMotion, controlRadius, controlSizes, controlSquare, controlText, fieldPresentation, fieldSizes, fieldTouchText } from "./lib/control-presentation";
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
        secondary:
          `bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-[0.97] ${ixControl}`,
        ghost:
          `hover:text-foreground text-muted-foreground border border-transparent ${ixControlSoft}`,
        link: `text-[var(--accent-text)] underline-offset-4 hover:underline ${ixControlSoft}`,
        sandbox:
          `bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border-accent)] hover:bg-[var(--btn-primary-hover)] active:scale-[0.97] ${ixControl}`,
      },
      size: {
        default: `${controlHeight.md} ${controlText.md} ${controlRadius.md} px-4 py-2`,
        md: `${controlHeight.md} ${controlText.md} ${controlRadius.md} px-4 py-2`,
        sm: `${controlHeight.sm} ${controlText.sm} ${controlRadius.sm} px-3`,
        lg: `${controlHeight.lg} ${controlText.lg} ${controlRadius.lg} px-7`,
        display: "tangle-control-display",
        xl: "h-13 rounded-xl px-9 text-base",
        icon: `${controlSquare.md} ${controlText.md} ${controlRadius.md}`,
        "icon-sm": `${controlSquare.sm} ${controlText.sm} ${controlRadius.sm}`,
        "icon-lg": `${controlSquare.lg} ${controlText.lg} ${controlRadius.lg}`,
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
  3: "grid-cols-2 sm:grid-cols-3 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:[&>div:not(:nth-child(3n+1))]:border-l",
  4: "grid-cols-2 sm:grid-cols-4 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:[&>div:not(:nth-child(4n+1))]:border-l",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l lg:[&>div:not(:nth-child(5n+1))]:border-l",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 max-sm:[&>div:not(:nth-child(2n+1))]:border-l sm:max-lg:[&>div:not(:nth-child(3n+1))]:border-l lg:[&>div:not(:nth-child(6n+1))]:border-l",
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
