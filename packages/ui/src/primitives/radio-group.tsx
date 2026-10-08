"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

/**
 * One choice from a set. Arrow keys move between items; pair each item with a
 * `Label` through `id`/`htmlFor`. The item matches `Checkbox` (16px, the
 * strong border, primary when chosen) so single and multiple choice lists
 * read as one family.
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} {...props} />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "peer inline-grid size-4 shrink-0 cursor-pointer place-content-center rounded-full border border-[var(--border-strong)] bg-transparent transition-[border-color,box-shadow] duration-150 ease-out",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-[var(--surface-danger-border)]",
      "data-[state=checked]:border-primary",
      focusRing,
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
