"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

/**
 * A two- or three-state checkbox. `checked="indeterminate"` draws a dash.
 * Pair it with a `Label` through `id`/`htmlFor`; `aria-invalid` paints the
 * danger hairline.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-grid size-4 shrink-0 cursor-pointer place-content-center rounded-[4px] border border-[var(--border-strong)] bg-transparent transition-[background-color,border-color,box-shadow] duration-150 ease-out",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-[var(--surface-danger-border)]",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      focusRing,
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
      {props.checked === "indeterminate" ? (
        <Minus aria-hidden="true" className="size-3.5" strokeWidth={3} />
      ) : (
        <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
