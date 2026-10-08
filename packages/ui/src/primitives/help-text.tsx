import * as React from "react";
import { cn } from "../lib/utils";

export interface HelpTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** `hint` describes a field; `error` reports what is wrong with its value. */
  tone?: "hint" | "error";
}

/**
 * Text under a field. One size (`--font-size-help`, 12px) for every field, so
 * forms across products read the same. Point the field's `aria-describedby` at
 * its `id`; Input and Textarea do this for their `hint` and `error` props.
 */
const HelpText = React.forwardRef<HTMLParagraphElement, HelpTextProps>(
  ({ className, tone = "hint", ...props }, ref) => (
    <p
      ref={ref}
      data-tone={tone}
      className={cn(
        "text-[length:var(--font-size-help,0.75rem)] leading-4",
        tone === "error" ? "font-medium text-[var(--surface-danger-text)]" : "text-[var(--text-dim)]",
        className,
      )}
      {...props}
    />
  ),
);
HelpText.displayName = "HelpText";

export { HelpText };
