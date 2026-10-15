/** React-free presentation. Consumers scan this published source with Tailwind. */
import { cva } from "class-variance-authority";
import { controlHeight, controlMotion, controlRadius, controlSizes, controlSquare, controlText, fieldPresentation, fieldSizes, fieldTouchText } from "./lib/control-presentation";
import { focusRing, focusFieldInvalid } from "./lib/focus";
import { ixControl, ixControlSoft } from "./lib/interaction";
import { cn } from "./lib/utils";
export { controlHeight, controlMotion, controlRadius, controlSizes, controlText, fieldPresentation, fieldSizes, fieldTouchText } from "./lib/control-presentation";

export const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,box-shadow,transform,scale] ${controlMotion} ${focusRing} disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
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
  row: "border-border border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted/50",
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
  transition: "data-[state=closed]:animate-out data-[state=open]:animate-in",
  fade: "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  position: "fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%]",
  surface: "gap-4 rounded-lg border bg-card p-6 shadow-lg duration-200",
  zoom: "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  closedPosition: "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
  openPosition: "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  close: "absolute top-4 right-4 rounded-sm opacity-70 transition-[opacity,box-shadow] hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
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
  trigger.setAttribute("aria-haspopup", "dialog");
  if (dialog.id) trigger.setAttribute("aria-controls", dialog.id);
  sync();trigger.addEventListener("click",show);dialog.addEventListener("close",close);dialog.addEventListener("click",click);
  return () => {trigger.removeEventListener("click",show);dialog.removeEventListener("close",close);dialog.removeEventListener("click",click);};
}

export const labelVariants = cva(
  "font-medium text-[length:var(--font-size-label,0.875rem)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export const helpPresentation = {
 root: "text-[length:var(--font-size-help,0.75rem)] leading-4",
 error: "font-medium text-[var(--surface-danger-text)]",
 hint: "text-[var(--text-dim)]",
};
