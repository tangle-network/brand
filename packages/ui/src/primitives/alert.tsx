import * as React from "react";
import { cn } from "../lib/utils";
import type { StatusTone } from "./status-pill";

/**
 * An inline message that stays on the page: a policy note above a form, a
 * failed save beside the field it concerns. For a message that interrupts, use
 * `AlertDialog`; for one that goes away by itself, use a toast.
 *
 * Each tone paints its fill, border and text from Brand's matched status
 * triple, the same one `StatusPill` uses, so the text is solved against its
 * own background on every plane. `neutral` is a card with body text.
 *
 * `danger` and `warning` announce themselves (`role="alert"`); the quieter
 * tones are `role="status"` so a screen reader is not interrupted by a note.
 */
export type AlertTone = Exclude<StatusTone, "running">;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  /** A leading icon. It takes the tone's colour and sits beside the title. */
  icon?: React.ReactNode;
}

const TONE: Record<AlertTone, string> = {
  neutral: "border-border bg-card text-card-foreground",
  info: "border-[var(--surface-info-border)] bg-[var(--surface-info-bg)] text-[var(--surface-info-text)]",
  success:
    "border-[var(--surface-success-border)] bg-[var(--surface-success-bg)] text-[var(--surface-success-text)]",
  warning:
    "border-[var(--surface-warning-border)] bg-[var(--surface-warning-bg)] text-[var(--surface-warning-text)]",
  danger:
    "border-[var(--surface-danger-border)] bg-[var(--surface-danger-bg)] text-[var(--surface-danger-text)]",
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ tone = "neutral", icon, className, children, role, ...props }, ref) => (
    <div
      ref={ref}
      role={role ?? (tone === "danger" || tone === "warning" ? "alert" : "status")}
      data-tone={tone}
      className={cn(
        "flex w-full min-w-0 gap-3 rounded-lg border px-4 py-3 text-sm",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="mt-0.5 flex shrink-0 [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <div className="grid min-w-0 flex-1 gap-1">{children}</div>
    </div>
  ),
);
Alert.displayName = "Alert";

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-medium leading-snug [overflow-wrap:anywhere]", className)} {...props} />;
}
AlertTitle.displayName = "AlertTitle";

/**
 * Body text. Under a toned alert it keeps the tone's ink, which is the colour
 * tested against the tone's fill; under `neutral` it is the muted tier.
 */
export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "leading-relaxed [overflow-wrap:anywhere] [[data-tone=neutral]_&]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
AlertDescription.displayName = "AlertDescription";
