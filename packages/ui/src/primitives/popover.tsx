"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { SurfaceMotion } from "../lib/surface-motion";
import { surfaceMotion } from "../lib/motion";
import { cn } from "../lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverClose = PopoverPrimitive.Close;

/**
 * A floating card anchored to its trigger, on the same surface, border and
 * shadow as `DropdownMenuContent`. Width defaults to 18rem; pass a width class
 * for wider content and keep long text wrapping inside it.
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, asChild, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 max-w-[calc(100vw-2rem)] origin-(--radix-popover-content-transform-origin) rounded-xl border border-border bg-card p-4 text-foreground shadow-[var(--shadow-card)] outline-hidden",
        surfaceMotion,
        className,
      )}
      {...props}
      asChild
    ><SurfaceMotion kind="popover" asChild={asChild}>{children}</SurfaceMotion></PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger };
