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
      // Off is an outlined track with a filled thumb, both in muted-foreground,
      // which clears 3:1 against the card and the canvas in both themes (a
      // switch's boundary is non-text content). The old bg-input track under a
      // bg-background thumb read as one flat shape, so an off switch was not
      // visible at all. --border-strong was tried and measured 2.2:1 on a white card.
      // On is an --accent-text track carrying a card-coloured thumb. Accent text
      // is held to text contrast on the card and the canvas, so the track's edge
      // and the thumb on it (the same pair, inverted) both clear 3:1 in every
      // theme. The bg-primary fill is tuned to carry white text and measured
      // 2.4:1 on the dark card, with a bg-background thumb at 2.5:1 on it.
      // brand's switch-contrast.test.ts asserts these pairs for every theme.
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 shadow-sm transition-[background-color,border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-transparent data-[state=checked]:bg-[var(--accent-text)] data-[state=unchecked]:border-muted-foreground data-[state=unchecked]:bg-transparent",
      focusRing,
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-[translate,background-color] data-[state=checked]:translate-x-4 data-[state=checked]:bg-card data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-muted-foreground",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
