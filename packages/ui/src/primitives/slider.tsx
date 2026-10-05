"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

/**
 * Range input with one thumb per value. A single value renders one thumb; an
 * array of two renders a range. The thumbs are what assistive technology
 * focuses, so the names go on them: `aria-label` / `aria-labelledby` name a
 * single thumb, and `thumbLabels` names each thumb of a range.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    thumbLabels?: string[];
  }
>(
  (
    {
      className,
      defaultValue,
      value,
      min = 0,
      max = 100,
      thumbLabels,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref,
  ) => {
  const values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min];
  const single = values.length === 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[disabled]:opacity-50",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1.5">
        <SliderPrimitive.Range className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabels?.[index] ?? (single ? ariaLabel : undefined)}
          aria-labelledby={single && !thumbLabels?.[index] ? ariaLabelledBy : undefined}
          className={cn(
            "block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm transition-[box-shadow] disabled:pointer-events-none",
            focusRing,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
  },
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
