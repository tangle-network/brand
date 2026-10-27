import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { cn } from "../lib/utils";
import type { StatusTone } from "./status-pill";

// A status ink is also its fill (Brand tokens), so a toned bar matches the state text beside it.
const TONE_FILL = {
  neutral: "bg-[var(--surface-neutral-text)]",
  success: "bg-[var(--surface-success-text)]",
  warning: "bg-[var(--surface-warning-text)]",
  danger: "bg-[var(--surface-danger-text)]",
} satisfies Partial<Record<StatusTone, string>>;

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "sandbox";
    /** A state the reading is in, such as `danger` at a limit; it replaces the variant's fill. */
    tone?: keyof typeof TONE_FILL;
    showValue?: boolean;
  }
>(
  (
    { className, value, variant = "default", tone, showValue = false, ...props },
    ref,
  ) => {
    const indicatorVariants = {
      default: "bg-primary",
      sandbox: "bg-[image:var(--accent-gradient-strong)]",
    };

    return (
      <div className="relative">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-muted",
            className,
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              "h-full w-full flex-1 transition-all duration-300 ease-out",
              tone ? TONE_FILL[tone] : indicatorVariants[variant],
            )}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
          />
        </ProgressPrimitive.Root>
        {showValue && (
          <span className="absolute -top-6 right-0 text-muted-foreground text-xs">
            {value}%
          </span>
        )}
      </div>
    );
  },
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
