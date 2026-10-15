import * as React from "react";
import { ixControl } from "../lib/interaction";
import { cardPresentation } from "../presentation";
import { cn } from "../lib/utils";
import { Heading } from "./heading";

/**
 * A card is one level of the brand surface ladder. It carries
 * `data-slot="card"`, and the brand's surface-context rule (tokens.css)
 * re-declares `--card` and `--well` for everything inside it: a Card or a
 * `bg-card` box inside a card paints the raised level, one inside that the
 * raised-2 level, and a field in any of them takes the well that is the
 * opposite step from its parent. Nesting needs no prop and no app selector.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "sandbox" | "elevated";
    /** Decorative hover feedback only (the shared green edge). Put actions in a native button or link. */
    hover?: boolean;
    /**
     * The card is itself the control, such as a card wrapped in a link: it takes
     * the full control states (hover glow, press, the ring after a click).
     */
    interactive?: boolean;
  }
>(({ className, variant = "default", hover = false, interactive = false, ...props }, ref) => {


  return (
    <div
      ref={ref}
      className={cn(
        cardPresentation.root,
        cardPresentation.variants[variant],
        (hover || interactive) && ixControl,
        className,
      )}
      data-slot="card"
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
    // Two lines at most: a guard, not a copy budget. Long copy belongs in help
    // text or a disclosure.
    className={cn("text-muted-foreground text-sm line-clamp-2", className)}
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
    className={cn(cardPresentation.padding, "[&:not(:first-child)]:pt-0", className)}
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
