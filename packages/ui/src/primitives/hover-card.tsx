import { cn } from "../lib/utils";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { tokenMilliseconds } from "../utils/token-milliseconds";

const HoverIntent = React.createContext({ content: { current: null as HTMLDivElement | null }, enter: (_target: Element) => {}, leave: (_event?: { relatedTarget: EventTarget | null }) => {}, restore: () => {}, press: () => {}, owns: (_target: EventTarget | null) => false });
type HoverCardProps = React.ComponentProps<typeof Popover> & {
  /** Existing DOM trigger for delegated canvas or virtual-list previews. */
  anchor?: HTMLElement | { getBoundingClientRect: () => DOMRect; contextElement: HTMLElement } | null;
  openDelay?: number;
  closeDelay?: number;
};

export function HoverCard({ anchor, open: controlled, defaultOpen = false, onOpenChange, openDelay, closeDelay, children, ...props }: HoverCardProps) {
  const element = anchor && ("contextElement" in anchor ? anchor.contextElement : anchor);
  const [own, setOwn] = React.useState({ anchor: element, open: defaultOpen });
  const intent = React.useRef<{ timer?: ReturnType<typeof setTimeout>; target?: Element; content: { current: HTMLDivElement | null }; restoring?: boolean; pressed?: boolean; onOpenChange?: HoverCardProps["onOpenChange"] }>({ content: { current: null } });
  intent.current.onOpenChange = onOpenChange;
  if (element) intent.current.target = element;
  const change = React.useCallback((next: boolean) => { clearTimeout(intent.current.timer); if (controlled === undefined) setOwn(current => current.anchor === element && current.open === next ? current : { anchor: element, open: next }); intent.current.onOpenChange?.(next); }, [controlled, element]);
  const owns = React.useCallback((target: EventTarget | null) => target instanceof Node && (!!(element ?? intent.current.target)?.contains(target) || !!intent.current.content.current?.contains(target)), [element]);
  const enter = React.useCallback((target: Element) => { if (intent.current.restoring || (intent.current.pressed && target === intent.current.content.current)) return; intent.current.pressed = false; if (target !== intent.current.content.current) intent.current.target = target; clearTimeout(intent.current.timer); intent.current.timer = setTimeout(() => change(true), openDelay ?? tokenMilliseconds("--duration-fast", target)); }, [change, openDelay]);
  const leave = React.useCallback((event?: { relatedTarget: EventTarget | null }) => { if (owns(event?.relatedTarget ?? null)) return; clearTimeout(intent.current.timer); intent.current.timer = setTimeout(() => { if (!owns(document.activeElement) || (!intent.current.content.current?.contains(document.activeElement) && !document.activeElement?.matches(":focus-visible"))) change(false); }, closeDelay ?? tokenMilliseconds("--duration-fast", element ?? intent.current.target)); }, [change, closeDelay, element, owns]);
  React.useEffect(() => {
    if (!element) { if (anchor === null) setOwn(current => current.open ? { anchor: element, open: false } : current); return () => clearTimeout(intent.current.timer); }
    const show = () => enter(element), blur = (event: FocusEvent) => leave(event);
    element.addEventListener("pointerenter", show); element.addEventListener("pointerleave", leave); element.addEventListener("focusin", show); element.addEventListener("focusout", blur);
    if (element.matches(":hover,:focus-within")) show();
    return () => { clearTimeout(intent.current.timer); element.removeEventListener("pointerenter", show); element.removeEventListener("pointerleave", leave); element.removeEventListener("focusin", show); element.removeEventListener("focusout", blur); };
  }, [element, enter, leave]);
  const restore = () => {
    intent.current.restoring = true;
    if (document.activeElement === document.body && intent.current.target instanceof HTMLElement) intent.current.target.focus({ preventScroll: true });
    queueMicrotask(() => { intent.current.restoring = false; });
  };
  return <HoverIntent.Provider value={{ content: intent.current.content, enter, leave, restore, press: () => { intent.current.pressed = true; change(false); }, owns }}><Popover {...props} open={anchor === null ? false : controlled ?? (own.anchor === element && own.open)} onOpenChange={change}>
    {anchor && <PopoverAnchor virtualRef={{ current: anchor }} />}{children}
  </Popover></HoverIntent.Provider>;
}

export const HoverCardTrigger = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }>(
  ({ className, onPointerEnter, onPointerLeave, onFocus, onBlur, onClickCapture, asChild, ...props }, ref) => {
    const intent = React.useContext(HoverIntent);
    const Trigger = asChild ? Slot : "a";
    return <PopoverAnchor asChild><Trigger ref={ref} tabIndex={0} className={cn("cursor-pointer underline-offset-4 hover:underline", className)}
      onPointerEnter={event => { onPointerEnter?.(event); if (!event.defaultPrevented && event.pointerType !== "touch") intent.enter(event.currentTarget); }}
      onPointerLeave={event => { onPointerLeave?.(event); if (!event.defaultPrevented) intent.leave(event); }}
      onFocus={event => { onFocus?.(event); if (!event.defaultPrevented && event.target.matches(":focus-visible")) intent.enter(event.currentTarget); }}
      onClickCapture={event => { onClickCapture?.(event); const action = event.target instanceof Element ? event.target.closest('a,button,input,select,textarea,[role="button"]') : null; if (!event.defaultPrevented && action && action !== event.currentTarget) intent.press(); }}
      onBlur={event => { onBlur?.(event); if (!event.defaultPrevented) intent.leave(event); }} {...props} /></PopoverAnchor>;
  },
);
HoverCardTrigger.displayName = "HoverCardTrigger";

export const HoverCardContent = React.forwardRef<React.ElementRef<typeof PopoverContent>, React.ComponentPropsWithoutRef<typeof PopoverContent>>(
  ({ className, onPointerEnter, onPointerLeave, onOpenAutoFocus, onCloseAutoFocus, onFocusOutside, ...props }, ref) => {
    const intent = React.useContext(HoverIntent);
    return <Slot ref={intent.content}><PopoverContent ref={ref} data-hover-card className={cn("w-64", className)}
      onOpenAutoFocus={event => { onOpenAutoFocus?.(event); event.preventDefault(); }}
      onCloseAutoFocus={event => { onCloseAutoFocus?.(event); if (!event.defaultPrevented) { event.preventDefault(); intent.restore(); } }}
      onFocusOutside={event => { onFocusOutside?.(event); if (intent.owns(event.detail.originalEvent.target)) event.preventDefault(); }}
      onPointerEnter={event => { onPointerEnter?.(event); if (!event.defaultPrevented) intent.enter(event.currentTarget); }}
      onPointerLeave={event => { onPointerLeave?.(event); if (!event.defaultPrevented) intent.leave(event); }} {...props} /></Slot>;
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
