import { Check } from "lucide-react";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";
import { TONE_CLASSES, type Tone } from "./tone";

/**
 * A label the user presses: a native `<button>` shaped like a `Tag`.
 *
 * Two kinds, chosen by whether `selected` is passed:
 *
 * - **Action** (`selected` omitted): runs `onClick` — a suggested prompt, an
 *   "add filter" entry point.
 * - **Filter / toggle** (`selected` is a boolean): a toggle button with
 *   `aria-pressed`. Pressing it calls `onSelectedChange(!selected)`; the caller
 *   owns the state. Use it for a set of filters (each independently on or off)
 *   or a single on/off option such as "Plan first".
 *
 * Selection is never shown by colour alone: a selected chip gains a check in
 * place of its icon, a stronger border and a deeper fill, and assistive tech
 * reads it from `aria-pressed`.
 *
 * For a removable label, use `Tag` with `onRemove`; a button cannot contain a
 * second button.
 */
export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: React.ReactNode;
  /** Categorical tone, or `neutral` (the default). */
  tone?: Tone;
  /** `soft` fills the chip; `outline` keeps only the border until selected. */
  emphasis?: "soft" | "outline";
  size?: "sm" | "md";
  /** Leading glyph, drawn in the tone's icon colour. A selected chip shows a check instead. */
  icon?: React.ReactNode;
  /** Makes the chip a toggle button; omit for an action chip. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}

const SIZE = {
  sm: "h-6 gap-1 px-2 text-xs [&_svg]:size-3",
  md: "h-8 gap-1.5 px-3 text-sm [&_svg]:size-3.5",
} as const;

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      className,
      children,
      tone = "neutral",
      emphasis = "soft",
      size = "sm",
      icon,
      selected,
      onSelectedChange,
      onClick,
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = TONE_CLASSES[tone];
    const toggle = selected !== undefined;
    const on = selected === true;
    const glyph = on ? <Check /> : icon;
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-pressed={toggle ? on : undefined}
        onClick={(event) => {
          onClick?.(event);
          if (toggle && !event.defaultPrevented) onSelectedChange?.(!on);
        }}
        className={cn(
          // The pseudo-element widens a small chip's hit area on touch screens
          // without changing its drawn size or the row's layout.
          "relative inline-flex min-w-0 max-w-full shrink-0 cursor-pointer select-none items-center rounded-md border font-medium leading-none transition-[background-color,border-color,color] duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] pointer-coarse:before:-inset-y-2.5",
          SIZE[size],
          emphasis === "outline" && !on ? classes.outline : classes.surface,
          !disabled && classes.hover,
          on && classes.selected,
          disabled && "cursor-not-allowed opacity-50",
          focusRing,
          className,
        )}
        {...props}
      >
        {glyph ? (
          <span aria-hidden="true" className={cn("inline-flex shrink-0", classes.icon)}>
            {glyph}
          </span>
        ) : null}
        {/* The full text on hover, since a long label truncates. */}
        <span className="min-w-0 truncate" title={typeof children === "string" ? children : undefined}>
          {children}
        </span>
      </button>
    );
  },
);
Chip.displayName = "Chip";

export { Chip };
