import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as React from "react";
import { controlHeight, controlMotion, controlRadius, controlSizes, controlSquare, controlText } from "../lib/control-presentation";
import { focusRing } from "../lib/focus";
import { cn } from "../lib/utils";

// Sizes follow the shared control scale (control-presentation.ts): sm, md and
// lg match Input, Textarea and SelectTrigger at the same size. xl is a display
// call to action outside that scale.
const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,box-shadow,transform,scale] ${controlMotion} ${focusRing} disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97]",
        outline:
          "border border-border bg-card hover:bg-muted active:scale-[0.97] text-foreground",
        secondary:
          "bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-[0.97]",
        ghost:
          "hover:bg-muted hover:text-foreground text-muted-foreground border border-transparent",
        link: "text-[var(--accent-text)] underline-offset-4 hover:underline",
        sandbox:
          "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--border-accent)] hover:bg-[var(--btn-primary-hover)] active:scale-[0.97]",
      },
      size: {
        default: `${controlHeight.md} ${controlText.md} ${controlRadius.md} px-4 py-2`,
        md: `${controlHeight.md} ${controlText.md} ${controlRadius.md} px-4 py-2`,
        sm: `${controlHeight.sm} ${controlText.sm} ${controlRadius.sm} px-3`,
        lg: `${controlHeight.lg} ${controlText.lg} ${controlRadius.lg} px-7`,
        xl: "h-13 rounded-xl px-9 text-base",
        icon: `${controlSquare.md} ${controlText.md} ${controlRadius.md}`,
        "icon-sm": `${controlSquare.sm} ${controlText.sm} ${controlRadius.sm}`,
        "icon-lg": `${controlSquare.lg} ${controlText.lg} ${controlRadius.lg}`,
        ...controlSizes,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "sandbox" | null;
  /** sm 32px, default/md 36px (`--control-height`), lg 44px; icon sizes are squares on the same heights. */
  size?: "default" | "md" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg" | "compact" | "touch" | null;
  asChild?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

type ButtonChildProps = React.HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  href?: string;
};

function preventActivation(event: React.SyntheticEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function disabledHandlers(props: React.HTMLAttributes<HTMLElement>) {
  const guardKey = (handler?: React.KeyboardEventHandler<HTMLElement>) =>
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") preventActivation(event);
      else handler?.(event);
    };

  return {
    onClickCapture: preventActivation,
    onAuxClickCapture: preventActivation,
    onDoubleClickCapture: preventActivation,
    onPointerDownCapture: preventActivation,
    onPointerUpCapture: preventActivation,
    onMouseDownCapture: preventActivation,
    onMouseUpCapture: preventActivation,
    onKeyDownCapture: guardKey(props.onKeyDownCapture),
    onKeyUpCapture: guardKey(props.onKeyUpCapture),
  };
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      const child = React.isValidElement<ButtonChildProps>(children) ? children : null;
      const isDisabled = disabled || loading || child?.props.disabled;

      // Slot composes child handlers first. Guard BOTH capture paths so neither
      // child nor Button activation handlers run, without changing enabled order.
      // Keep slotted content intact: its action name must survive loading too.
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
          {...(isDisabled ? disabledHandlers(props) : {})}
        >
          {child ? React.cloneElement(child, {
            ...(loading ? { "aria-busy": true } : {}),
            ...(isDisabled ? {
              "aria-disabled": true,
              ...(child.type === "button" ? { disabled: true } : { tabIndex: -1 }),
              // Removing href also prevents native context-menu / middle-click
              // navigation. Keep link semantics while it is unavailable.
              ...(child.type === "a" ? {
                href: undefined,
                role: child.props.role ?? props.role ?? "link",
              } : {}),
              ...disabledHandlers(child.props),
            } : {}),
          }) : children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || props["aria-busy"]}
      >
        {loading && (
          <svg
            className="mr-2 -ml-1 h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
            focusable="false"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
