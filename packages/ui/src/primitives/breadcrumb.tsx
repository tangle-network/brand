import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import * as React from "react";

/**
 * Where you are inside a nested surface — the workspace, its settings, the
 * section you're in. Each crumb is a link except the last, which is the page.
 *
 * ```tsx
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem><BreadcrumbLink href="/workspaces/ws-1">Recenter demo</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbLink href="/workspaces/ws-1/settings">Settings</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbPage>Connections</BreadcrumbPage></BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 *
 * On narrow viewports the list scrolls horizontally with a fade mask rather
 * than wrapping — a crumb trail reads as one line, not a paragraph.
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { separator?: React.ReactNode }
>(({ className, ...props }, ref) => (
  <nav ref={ref} aria-label="Breadcrumb" className={cn("relative", className)} {...props} />
));
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto",
      "[mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]",
      "[-webkit-mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]",
      "scrollbar-none",
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("inline-flex items-center gap-1.5 shrink-0", className)} {...props} />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn("transition-colors hover:text-foreground", className)}
    {...props}
  />
));
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn("shrink-0 text-muted-foreground/60", className)}
    {...props}
  >
    {children ?? <ChevronRight className="size-3.5" aria-hidden />}
  </span>
));
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn("flex size-6 items-center justify-center", className)}
    {...props}
  >
    <span className="text-muted-foreground">…</span>
    <span className="sr-only">More</span>
  </span>
));
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
