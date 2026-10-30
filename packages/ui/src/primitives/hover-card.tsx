import { cn } from "../lib/utils";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";

const HoverIntent = React.createContext({ enter: (_target: Element) => {}, leave: () => {}, restore: () => {} });
type HoverCardProps = React.ComponentProps<typeof Popover> & {
  /** Existing DOM trigger for delegated canvas or virtual-list previews. */
  anchor?: HTMLElement | { getBoundingClientRect: () => DOMRect; contextElement: HTMLElement } | null;
  openDelay?: number;
  closeDelay?: number;
};

/** One hover policy and Popover's keyboard/focus behavior; delays follow the trigger's fast token. */
export function HoverCard({ anchor, open: controlled, defaultOpen = false, onOpenChange, openDelay, closeDelay, children, ...props }: HoverCardProps) {
  const element = anchor && ("contextElement" in anchor ? anchor.contextElement : anchor);
  const [own, setOwn] = React.useState(defaultOpen);
  const intent = React.useRef<{ timer?: ReturnType<typeof setTimeout>; target?: Element; restoring?: boolean }>({});
  if (element) intent.current.target = element;
  const change = React.useCallback((next: boolean) => { clearTimeout(intent.current.timer); if (controlled === undefined) setOwn(next); onOpenChange?.(next); }, [controlled, onOpenChange]);
  const delay = (target: Element | null | undefined) => {
    if (typeof document === "undefined") return 0;
    const value = getComputedStyle(target ?? document.documentElement).getPropertyValue("--duration-fast").trim();
    return (parseFloat(value) || 0) * (value.endsWith("ms") ? 1 : 1000);
  };
  const enter = React.useCallback((target: Element) => { if (intent.current.restoring) return; if (!target.closest("[data-hover-card]")) intent.current.target = target; clearTimeout(intent.current.timer); intent.current.timer = setTimeout(() => change(true), openDelay ?? delay(target)); }, [change, openDelay]);
  const leave = React.useCallback(() => { clearTimeout(intent.current.timer); intent.current.timer = setTimeout(() => change(false), closeDelay ?? delay(element ?? intent.current.target)); }, [change, closeDelay, element]);
  React.useEffect(() => {
    if (!element) return () => clearTimeout(intent.current.timer);
    const show = () => enter(element), blur = (event: FocusEvent) => { if (!(event.relatedTarget instanceof Element && event.relatedTarget.closest("[data-hover-card]"))) leave(); };
    element.addEventListener("pointerenter", show); element.addEventListener("pointerleave", leave); element.addEventListener("focusin", show); element.addEventListener("focusout", blur);
    return () => { clearTimeout(intent.current.timer); element.removeEventListener("pointerenter", show); element.removeEventListener("pointerleave", leave); element.removeEventListener("focusin", show); element.removeEventListener("focusout", blur); };
  }, [anchor, element, enter, leave]);
  const restore = () => {
    intent.current.restoring = true;
    if (document.activeElement === document.body && intent.current.target instanceof HTMLElement) intent.current.target.focus({ preventScroll: true });
    queueMicrotask(() => { intent.current.restoring = false; });
  };
  return <HoverIntent.Provider value={{ enter, leave, restore }}><Popover {...props} open={controlled ?? own} onOpenChange={change}>
    {anchor && <PopoverAnchor virtualRef={{ current: anchor }} />}{children}
  </Popover></HoverIntent.Provider>;
}

export const HoverCardTrigger = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }>(
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

export const HoverCardContent = React.forwardRef<React.ElementRef<typeof PopoverContent>, React.ComponentPropsWithoutRef<typeof PopoverContent>>(
  ({ className, onPointerEnter, onPointerLeave, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
    const intent = React.useContext(HoverIntent);
    return <PopoverContent ref={ref} data-hover-card className={cn("w-64", className)}
      onOpenAutoFocus={event => { onOpenAutoFocus?.(event); event.preventDefault(); }}
      onCloseAutoFocus={event => { onCloseAutoFocus?.(event); if (!event.defaultPrevented) { event.preventDefault(); intent.restore(); } }}
      onPointerEnter={event => { onPointerEnter?.(event); if (!event.defaultPrevented) intent.enter(event.currentTarget); }}
      onPointerLeave={event => { onPointerLeave?.(event); if (!event.defaultPrevented) intent.leave(); }} {...props} />;
  },
);
HoverCardContent.displayName = "HoverCardContent";

export function HoverCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 pb-2", className)} {...props} />;
}

export function HoverCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h4 className={cn("text-sm font-semibold leading-none", className)} {...props} />;
}

export function HoverCardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
