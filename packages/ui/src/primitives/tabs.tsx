import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { focusRing } from "../lib/focus";
import { tabsPresentation } from "../presentation";
import { cn } from "../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills" | "underline";
  }
>(({ className, variant = "default", ...props }, ref) => {


  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsPresentation.list[variant], className)}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "pills" | "underline";
  }
>(({ className, variant = "default", ...props }, ref) => {
  // Selection is the shared selected state (lib/interaction.ts): a tint and an
  // inset ring for default and pills, a 2px underline for underline, whose
  // border-b-2 slot stays transparent.


  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsPresentation.trigger[variant], className)}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4",
      focusRing,
      "data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:animate-in",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
