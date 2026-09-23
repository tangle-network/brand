import * as React from "react";
import { focusField, focusFieldInvalid } from "../lib/focus";
import { cn } from "../lib/utils";

import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  cn(
    "flex w-full rounded-lg border bg-card px-4 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:font-medium file:text-sm",
    focusField,
  ),
  {
    variants: {
      // `default` and `sandbox` render the same field; both names stay valid.
      variant: {
        default: "",
        sandbox: "",
        error: focusFieldInvalid,
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3",
        lg: "h-12 px-5",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, variant, size, label, error, hint, id, ...props },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const input = (
      <input
        type={type}
        id={inputId}
        className={cn(inputVariants({ variant: error ? "error" : variant, size, className }))}
        ref={ref}
        {...props}
      />
    );

    if (!label && !error && !hint) return input;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-medium text-foreground text-sm"
          >
            {label}
          </label>
        )}
        {input}
        {error && <p className="text-[var(--surface-danger-text)] text-sm font-medium">{error}</p>}
        {hint && !error && (
          <p className="text-[var(--text-dim)] text-sm">{hint}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Both values render the same field. */
  variant?: "default" | "sandbox";
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    // `variant` is taken out so it never reaches the DOM element.
    { className, variant: _variant, label, error, hint, id, ...props },
    ref,
  ) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    const textarea = (
      <textarea
        id={textareaId}
        className={cn(
          "flex min-h-[120px] w-full resize-y rounded-lg border bg-card px-4 py-3 text-sm",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          focusField,
          error && focusFieldInvalid,
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    if (!label && !error && !hint) return textarea;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block font-medium text-muted-foreground text-sm"
          >
            {label}
          </label>
        )}
        {textarea}
        {error && <p className="text-[var(--surface-danger-text)] text-sm">{error}</p>}
        {hint && !error && (
          <p className="text-[var(--text-dim)] text-sm">{hint}</p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
