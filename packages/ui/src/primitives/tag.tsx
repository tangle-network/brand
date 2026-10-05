import { X } from "lucide-react";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";
import { TONE_CLASSES, type Tone } from "./tone";

/**
 * A static label for what something IS: a category, a kind, a named value.
 *
 * Tags are squared-off (`rounded-md`) where `StatusPill` is fully round, so a
 * category and a state never share a silhouette even before colour is read.
 * For a state, use `StatusPill`. For a label the user presses, use `Chip`.
 *
 * `onRemove` adds a native remove button after the label — the removable
 * variant, for a recipient, an applied filter or an attached item. The tag
 * itself stays non-interactive, so the remove button is the only tab stop.
 */
export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  children: React.ReactNode;
  /** Categorical tone, or `neutral` (the default) for an uncategorised label. */
  tone?: Tone;
  /** `soft` fills the tag; `outline` keeps only the border, for dense rows. */
  emphasis?: "soft" | "outline";
  size?: "sm" | "md";
  /** A leading glyph, drawn in the tone's icon colour. Decorative. */
  icon?: React.ReactNode;
  /** Shows a remove button; called when it is pressed. */
  onRemove?: () => void;
  /**
   * Accessible name of the remove button. Defaults to "Remove <label>" when
   * the label is a string; pass it when the label is not plain text.
   */
  removeLabel?: string;
}

const SIZE = {
  sm: "h-6 gap-1 px-2 text-xs [&_svg]:size-3",
  md: "h-7 gap-1.5 px-2.5 text-sm [&_svg]:size-3.5",
} as const;

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  (
    { className, children, tone = "neutral", emphasis = "soft", size = "sm", icon, onRemove, removeLabel, ...props },
    ref,
  ) => {
    const classes = TONE_CLASSES[tone];
    const label = removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove");
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex min-w-0 max-w-full shrink-0 items-center rounded-md border font-medium leading-none",
          SIZE[size],
          emphasis === "outline" ? classes.outline : classes.surface,
          onRemove && (size === "sm" ? "pr-0.5" : "pr-1"),
          className,
        )}
        {...props}
      >
        {icon ? (
          <span aria-hidden="true" className={cn("inline-flex shrink-0", classes.icon)}>
            {icon}
          </span>
        ) : null}
        {/* A long label truncates here rather than pushing the remove button
            out; the title gives its full text on hover. */}
        <span className="min-w-0 truncate" title={typeof children === "string" ? children : undefined}>
          {children}
        </span>
        {onRemove ? (
          <button
            type="button"
            aria-label={label}
            onClick={onRemove}
            className={cn(
              // The visible target is the glyph's box; the pseudo-element widens
              // the hit area without moving the tag's layout.
              "relative inline-flex shrink-0 items-center justify-center rounded-sm opacity-70 transition-[opacity,background-color] duration-150 ease-out hover:bg-[color-mix(in_srgb,currentColor_14%,transparent)] hover:opacity-100 before:absolute before:-inset-1.5 before:content-['']",
              size === "sm" ? "size-5" : "size-6",
              focusRing,
            )}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </span>
    );
  },
);
Tag.displayName = "Tag";

export { Tag };
