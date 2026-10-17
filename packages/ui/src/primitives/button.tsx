import { Slot } from "@radix-ui/react-slot";
import { buttonVariants } from "../presentation";
import * as React from "react";
import { controlMotion } from "../lib/motion";
import { focusRing } from "../lib/focus";
import { ixControl, ixControlSoft, ixSelected } from "../lib/interaction";
import { cn } from "../lib/utils";

// Sizes follow the shared control scale (control-presentation.ts): sm, md and
// lg match Input, Textarea and SelectTrigger at the same size. xl is a display
// call to action outside that scale.
//
// Interaction (lib/interaction.ts): a variant with a border or a fill takes
// `ixControl` (green edge and glow on hover, press and after a click); ghost,
// link and bare take `ixControlSoft`, a wash that never glows. A toggle button
// (any `aria-pressed`) adds `ixControl` + `ixSelected` whatever its variant.

// `bare` keeps the shared focus ring, disabled and loading behavior and drops
// every surface, size and type class. It is for pressable rows, tiles and pills
// that draw their own layout; anything that reads as a button uses a styled
// variant and a size.
const bareButton = `${focusRing} ${controlMotion} ${ixControlSoft} disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50`;

/** One Button render's classes: variant and size, the toggle states, then the caller's. */
function buttonClassName(
  variant: ButtonProps["variant"],
  size: ButtonProps["size"],
  pressed: React.AriaAttributes["aria-pressed"],
  className: string | undefined,
) {
  const toggle = pressed === undefined ? undefined : `${ixControl} ${ixSelected}`;
  return variant === "bare"
    ? cn(bareButton, toggle, className)
    : cn(buttonVariants({ variant, size }), toggle, className);
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** `destructive-outline` is a destructive action at rest, such as "Delete project…", whose confirmation uses `destructive`. */
  variant?: "default" | "destructive" | "destructive-outline" | "outline" | "secondary" | "ghost" | "link" | "sandbox" | "bare" | null;
  /** sm 32px, default/md 36px (`--control-height`), lg 44px; icon sizes are squares on the same heights. */
  size?: "default" | "md" | "sm" | "lg" | "xl" | "display" | "icon" | "icon-sm" | "icon-lg" | "compact" | "touch" | null;
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
          className={buttonClassName(variant, size, props["aria-pressed"], className)}
          ref={ref}
          data-variant={size === "display" ? variant ?? "default" : undefined}
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
        className={buttonClassName(variant, size, props["aria-pressed"], className)}
        ref={ref}
        data-variant={size === "display" ? variant ?? "default" : undefined}
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
