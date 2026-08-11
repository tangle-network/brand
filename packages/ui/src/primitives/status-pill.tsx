import * as React from "react";
import { cn } from "../lib/utils";

/**
 * A run/resource state, told three ways at once.
 *
 * Status is the one place a console cannot afford to speak in colour alone: a
 * red dot and a green dot are the same dot to roughly one man in twelve, and
 * identical in a greyscale print or a screenshot pasted into a ticket. So every
 * pill carries all three channels — a GLYPH whose silhouette differs per tone,
 * the tone's COLOUR, and the state's own LABEL as text.
 *
 * The glyphs are chosen to survive at 8px and to differ in outline rather than
 * in fill: a ring reads as "still open", a solid disc as "settled", a slashed
 * disc as "stopped". Two states never share one silhouette.
 *
 * Each tone draws its fill, border and text from ONE matched token triple.
 * That pairing is the whole point: `--surface-warning-text` is tuned against
 * `--surface-warning-bg` and measures 4.16:1 on the light page canvas, so the
 * same colour used as bare text on a page fails AA while the pill passes. A
 * component that always brings its own background cannot be placed onto a plane
 * that breaks it.
 */
export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "running";

export interface StatusPillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  tone: StatusTone;
  children: React.ReactNode;
  /**
   * Drops the fill and border, leaving a toned GLYPH beside a label in the
   * inherited body colour.
   *
   * The label deliberately does not keep the tone. A status colour is solved
   * against its own background, so lifting it onto whatever plane the caller
   * happens to be on is the failure this component exists to prevent — the
   * warning tone as bare text on the light page canvas measures 4.16:1, under
   * the 4.5:1 body floor. The glyph keeps it because a glyph is non-text
   * content and clears its own 3:1 floor comfortably, so the tone still reads
   * without the label going quiet.
   *
   * For a control that supplies its own surface (a chip, a selected row).
   */
  bare?: boolean;
  size?: "sm" | "md";
}

const TONE_SURFACE: Record<StatusTone, string> = {
  success:
    "bg-[var(--surface-success-bg)] text-[var(--surface-success-text)] border-[var(--surface-success-border)]",
  warning:
    "bg-[var(--surface-warning-bg)] text-[var(--surface-warning-text)] border-[var(--surface-warning-border)]",
  danger:
    "bg-[var(--surface-danger-bg)] text-[var(--surface-danger-text)] border-[var(--surface-danger-border)]",
  info: "bg-[var(--surface-info-bg)] text-[var(--surface-info-text)] border-[var(--surface-info-border)]",
  running:
    "bg-[var(--surface-info-bg)] text-[var(--surface-info-text)] border-[var(--surface-info-border)]",
  neutral:
    "bg-[var(--surface-neutral-bg)] text-[var(--surface-neutral-text)] border-[var(--surface-neutral-border)]",
};

/**
 * The text tier alone, for `bare`. Declared rather than recovered from
 * `TONE_SURFACE` by string search: picking the `text-` class out of that string
 * silently yields `undefined` the moment the triple gains a second `text-`
 * utility, and an undefined class removes the tone from the one channel `bare`
 * has left — the glyph — with nothing to signal that it happened.
 */
const TONE_TEXT: Record<StatusTone, string> = {
  success: "text-[var(--surface-success-text)]",
  warning: "text-[var(--surface-warning-text)]",
  danger: "text-[var(--surface-danger-text)]",
  info: "text-[var(--surface-info-text)]",
  running: "text-[var(--surface-info-text)]",
  neutral: "text-[var(--surface-neutral-text)]",
};

/**
 * One glyph per silhouette. `currentColor` throughout so the mark inherits the
 * tone's text colour and can never drift from the label beside it.
 */
function ToneGlyph({ tone }: { tone: StatusTone }) {
  // `aria-hidden` is written on every `<svg>` rather than carried in this
  // spread: the label beside the glyph already names the state, so a title here
  // would announce it twice — and a lint rule that reads JSX statically cannot
  // see the attribute through a spread, so it reports each mark as an unlabelled
  // image.
  const common = {
    viewBox: "0 0 8 8",
    className: "size-2 shrink-0",
  };
  switch (tone) {
    // Settled and good: a solid disc.
    case "success":
      return (
        <svg {...common} aria-hidden="true" fill="currentColor">
          <circle cx="4" cy="4" r="3.25" />
        </svg>
      );
    // Settled and bad: a disc with a bar through it, so it differs from
    // success in OUTLINE and not only in hue.
    case "danger":
      return (
        <svg
          {...common}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="4" cy="4" r="3.1" fill="currentColor" opacity="0.35" />
          <path d="M1.9 6.1 6.1 1.9" strokeLinecap="round" />
        </svg>
      );
    // Needs a person: a triangle.
    case "warning":
      return (
        <svg {...common} aria-hidden="true" fill="currentColor">
          <path d="M4 0.6 7.7 7.1H0.3z" />
        </svg>
      );
    // Still moving: an open ring, visibly hollow at 8px.
    case "running":
      return (
        <svg
          {...common}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="4" cy="4" r="2.9" />
        </svg>
      );
    // Informational: a square, the only right-angled mark in the set.
    case "info":
      return (
        <svg {...common} aria-hidden="true" fill="currentColor">
          <rect x="0.9" y="0.9" width="6.2" height="6.2" rx="1.2" />
        </svg>
      );
    // Nothing has happened: a dash. No enclosed area at all.
    default:
      return (
        <svg
          {...common}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M1 4h6" strokeLinecap="round" />
        </svg>
      );
  }
}

const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ className, tone, children, bare = false, size = "sm", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        bare
          ? "border border-transparent bg-transparent px-0"
          : cn("border", TONE_SURFACE[tone]),
        className,
      )}
      {...props}
    >
      {/* In `bare` mode the tone rides on the glyph alone, so it is scoped to
          the wrapper the glyph sits in rather than applied to the whole pill. */}
      <span className={cn("inline-flex", bare && TONE_TEXT[tone])}>
        <ToneGlyph tone={tone} />
      </span>
      {children}
    </span>
  ),
);
StatusPill.displayName = "StatusPill";

export { StatusPill };
