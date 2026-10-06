"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Off is an outlined track with a filled thumb, both on --border-strong,
      // the hairline brand gates at 3:1 against a field. A filled bg-input track
      // with a bg-background thumb was one flat shape in both themes, so a
      // switch that was off could not be seen at all.
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 shadow-sm transition-[background-color,border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent data-[state=checked]:bg-primary data-[state=unchecked]:border-[var(--border-strong)] data-[state=unchecked]:bg-transparent",
      focusRing,
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-[translate,background-color] data-[state=checked]:translate-x-4 data-[state=checked]:bg-background data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-[var(--border-strong)]",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
