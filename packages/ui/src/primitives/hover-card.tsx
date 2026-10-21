import { cn } from "../lib/utils";
import * as React from "react";

/**
 * A rich hover preview: the face of a person, product, or record that appears
 * when you pause on its trigger. Radix HoverCard under the hood, styled on the
 * md3 surface ladder — the card sits on `--md3-surface-container-highest`
 * (L4, the overlay plane) so it reads as a floating layer above the page.
 *
 * ```tsx
 * <HoverCard>
 *   <HoverCardTrigger>@noa</HoverCardTrigger>
 *   <HoverCardContent>
 *     <HoverCardHeader>
 *       <HoverCardTitle>Noa</HoverCardTitle>
 *       <HoverCardDescription>Housekeeping · es</HoverCardDescription>
 *     </HoverCardHeader>
 *     <p>3 rooms today · 1 pending</p>
 *   </HoverCardContent>
 * </HoverCard>
 * ```
 *
 * The content is **lazy** — it mounts only when hovered, so a page of 50
 * triggers costs nothing until the person pauses on one.
 */
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <HoverCardPrimitive.Trigger
    ref={ref}
    className={cn("cursor-pointer underline-offset-4 hover:underline", className)}
    {...props}
  />
));
HoverCardTrigger.displayName = HoverCardPrimitive.Trigger.displayName;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & {
    /** Which edge the card prefers. Defaults to bottom. */
    side?: "top" | "right" | "bottom" | "left";
    /** Pixel gap from the trigger. Defaults to 6. */
    alignOffset?: number;
  }
>(({ className, side = "bottom", alignOffset = 6, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      side={side}
      alignOffset={alignOffset}
      sideOffset={6}
      className={cn(
        "z-50 w-64 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

function HoverCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 pb-2", className)} {...props} />;
}

function HoverCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn("text-sm font-semibold leading-none", className)} {...props} />;
}

function HoverCardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardDescription,
};
