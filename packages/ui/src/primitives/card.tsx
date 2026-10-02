import * as React from "react";
import { cn } from "../lib/utils";
import { Heading } from "./heading";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "sandbox" | "elevated";
    /** Decorative border feedback only. Put actions in a native button or link. */
    hover?: boolean;
  }
>(({ className, variant = "default", hover = false, ...props }, ref) => {
  const variants = {
    default: "bg-card border-border",
    elevated: "bg-muted/50 border-border shadow-[var(--shadow-card)]",
    glass: "bg-card/80 backdrop-blur-xl border-border shadow-[var(--shadow-card)]",
    sandbox: "bg-muted/50 border-primary/20 shadow-[var(--shadow-accent)]",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-lg)] border text-card-foreground transition-[border-color,box-shadow]",
        "duration-[var(--transition-default)]",
        variants[variant],
        hover && "hover:border-[var(--border-strong)]",
        className,
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level appropriate to the surrounding document; h3 remains the default. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as = "h3", ...props }, ref) => (
    <Heading
      ref={ref}
      variant="subsection"
      as={as}
      className={className}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 [&:not(:first-child)]:pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap items-center gap-2 p-4 [&:not(:first-child)]:pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
