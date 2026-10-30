import { cn } from "../lib/utils";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";

const HoverIntent = React.createContext({ enter: (_target: Element) => {}, leave: () => {} });
type HoverCardProps = React.ComponentProps<typeof Popover> & {
  /** Existing DOM trigger for delegated canvas or virtual-list previews. */
  anchor?: HTMLElement | null;
  openDelay?: number;
  closeDelay?: number;
};

/** One hover policy and Popover's keyboard/focus behavior; delays follow the trigger's fast token. */
function HoverCard({ anchor, open: controlled, defaultOpen = false, onOpenChange, openDelay, closeDelay, children, ...props }: HoverCardProps) {
  const [own, setOwn] = React.useState(defaultOpen);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const change = React.useCallback((next: boolean) => { if (controlled === undefined) setOwn(next); onOpenChange?.(next); }, [controlled, onOpenChange]);
  const delay = (target: Element | null | undefined) => {
    if (typeof document === "undefined") return 0;
    const value = getComputedStyle(target ?? document.documentElement).getPropertyValue("--duration-fast").trim();
    return (parseFloat(value) || 0) * (value.endsWith("ms") ? 1 : 1000);
  };
  const enter = React.useCallback((target: Element) => { clearTimeout(timer.current); timer.current = setTimeout(() => change(true), openDelay ?? delay(target)); }, [change, openDelay]);
  const leave = React.useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(() => change(false), closeDelay ?? delay(anchor)); }, [change, closeDelay, anchor]);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (!anchor) return;
    const show = () => enter(anchor);
    anchor.addEventListener("pointerenter", show); anchor.addEventListener("pointerleave", leave);
    return () => { anchor.removeEventListener("pointerenter", show); anchor.removeEventListener("pointerleave", leave); };
  }, [anchor, enter, leave]);
  return <HoverIntent.Provider value={{ enter, leave }}><Popover {...props} open={controlled ?? own} onOpenChange={change}>
    {anchor && <PopoverAnchor virtualRef={{ current: anchor }} />}{children}
  </Popover></HoverIntent.Provider>;
}

const HoverCardTrigger = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }>(
  ({ className, onPointerEnter, onPointerLeave, onFocus, onBlur, asChild, ...props }, ref) => {
    const intent = React.useContext(HoverIntent);
    const Trigger = asChild ? Slot : "a";
    return <PopoverTrigger asChild><Trigger ref={ref} tabIndex={0} className={cn("cursor-pointer underline-offset-4 hover:underline", className)}
      onPointerEnter={event => { onPointerEnter?.(event); if (!event.defaultPrevented) intent.enter(event.currentTarget); }}
      onPointerLeave={event => { onPointerLeave?.(event); if (!event.defaultPrevented) intent.leave(); }}
      onFocus={event => { onFocus?.(event); if (!event.defaultPrevented) intent.enter(event.currentTarget); }}
      onBlur={event => { onBlur?.(event); if (!event.defaultPrevented && !(event.relatedTarget instanceof Element && event.relatedTarget.closest("[data-hover-card]"))) intent.leave(); }} {...props} /></PopoverTrigger>;
  },
);
HoverCardTrigger.displayName = "HoverCardTrigger";

const HoverCardContent = React.forwardRef<React.ElementRef<typeof PopoverContent>, React.ComponentPropsWithoutRef<typeof PopoverContent>>(
  ({ className, onPointerEnter, onPointerLeave, onOpenAutoFocus, ...props }, ref) => {
    const intent = React.useContext(HoverIntent);
    return <PopoverContent ref={ref} data-hover-card className={cn("w-64", className)}
      onOpenAutoFocus={event => { onOpenAutoFocus?.(event); event.preventDefault(); }}
      onPointerEnter={event => { onPointerEnter?.(event); if (!event.defaultPrevented) intent.enter(event.currentTarget); }}
      onPointerLeave={event => { onPointerLeave?.(event); if (!event.defaultPrevented) intent.leave(); }} {...props} />;
  },
);
HoverCardContent.displayName = "HoverCardContent";

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
