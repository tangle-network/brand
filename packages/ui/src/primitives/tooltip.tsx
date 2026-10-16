"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { SurfaceMotion } from "../lib/surface-motion";
import { surfaceMotion } from "../lib/motion";
import { cn } from "../lib/utils";

/**
 * Wrap an app (or a toolbar) once. The open delay applies to the first tooltip;
 * moving between triggers inside `skipDelayDuration` opens the next one at
 * once, which keeps an icon rail fast to scan.
 */
const TooltipProvider = ({
  delayDuration = 400,
  skipDelayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider
    delayDuration={delayDuration}
    skipDelayDuration={skipDelayDuration}
    {...props}
  />
);
TooltipProvider.displayName = "TooltipProvider";

// Keep Radix on its controlled path even for the public uncontrolled API.
// Its global tooltip.open event then runs before the new open state commits:
// a retained content listener cannot turn its own accepted reopen into Close.
const Tooltip = ({ open, defaultOpen = false, onOpenChange, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) => {
  const [localOpen, setLocalOpen] = React.useState(defaultOpen);
  return <TooltipPrimitive.Root
    {...props}
    open={open ?? localOpen}
    onOpenChange={(next) => {
      if (open === undefined) setLocalOpen(next);
      onOpenChange?.(next);
    }}
  />;
};
Tooltip.displayName = "Tooltip";

const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Inverse-surface label for a control whose name is otherwise only an icon.
 * It is supplementary: the trigger still needs its own accessible name.
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, asChild, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-2.5 py-1.5 text-background text-xs leading-snug shadow-md",
        surfaceMotion,
        className,
      )}
      {...props}
      asChild
    ><SurfaceMotion kind="tooltip" asChild={asChild}>{children}</SurfaceMotion></TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
