"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { SurfaceMotion } from "../lib/surface-motion";
import { controlMotion, surfaceMotion } from "../lib/motion";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

/** A dialog that slides in from an edge: a mobile nav drawer or a side panel. */
const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, asChild, children, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40",
      surfaceMotion,
      className,
    )}
    {...props}
    asChild
  ><SurfaceMotion kind="overlay" asChild={asChild}>{children}</SurfaceMotion></SheetPrimitive.Overlay>
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  [
    "fixed z-50 flex flex-col gap-4 border-border bg-card shadow-lg",
    surfaceMotion,
  ],
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        top: "inset-x-0 top-0 h-auto border-b",
        bottom:
          "inset-x-0 bottom-0 h-auto border-t",
      },
    },
    defaultVariants: { side: "right" },
  },
);

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> &
    VariantProps<typeof sheetVariants> & {
      /** Hide only the built-in close button; Escape and outside clicks still dismiss. */
      hideCloseButton?: boolean;
    }
>(({ className, children, side = "right", hideCloseButton = false, asChild, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
      asChild
    >
      <SurfaceMotion kind="sheet" side={side ?? "right"} asChild={asChild}>
      {children}
      {!hideCloseButton && (
        <SheetPrimitive.Close
          className={cn(
            "absolute top-4 right-4 rounded-sm text-muted-foreground opacity-70 transition-[opacity,box-shadow] hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none",
            controlMotion,
            focusRing,
          )}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      )}
      </SurfaceMotion>
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 p-4 pr-10", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("font-semibold text-base text-foreground leading-tight", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
