"use client";

import * as React from "react";
import { controlRadius, controlSizes, controlText, fieldPresentation, fieldSizes, fieldTouchText } from "../lib/control-presentation";
import { focusFieldInvalid } from "../lib/focus";
import { cn } from "../lib/utils";
import { HelpText } from "./help-text";
import { Label } from "./label";

import { cva, type VariantProps } from "class-variance-authority";

// Sizes follow the shared control scale (control-presentation.ts), so an Input
// and a Button at the same size share a height, text size and corner.
const inputVariants = cva(
  cn(
    "flex w-full border py-1 placeholder:text-[var(--text-dim)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:font-medium file:text-sm",
    fieldPresentation,
    fieldTouchText,
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
        default: fieldSizes.md,
        md: fieldSizes.md,
        sm: fieldSizes.sm,
        lg: fieldSizes.lg,
        compact: cn(fieldSizes.md, controlSizes.compact),
        touch: cn(fieldSizes.md, controlSizes.touch),
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Only rendered descriptions are added; caller IDs and their order are retained.
function descriptionIds(...ids: Array<string | undefined>) {
  return [...new Set(ids.join(" ").split(/\s+/).filter(Boolean))].join(" ") || undefined;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className, type, variant, size, label, error, hint, id,
      "aria-describedby": describedBy, "aria-invalid": invalid, ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const input = (
      <input
        type={type}
        id={inputId}
        className={cn(inputVariants({ variant: error ? "error" : variant, size, className }))}
        ref={ref}
        {...props}
        aria-describedby={descriptionIds(describedBy, hintId, errorId)}
        aria-invalid={error || variant === "error" ? true : invalid}
      />
    );

    if (!label && !error && !hint) return input;

    return (
      <div className="w-full space-y-1.5">
        {label && <Label htmlFor={inputId} className="block">{label}</Label>}
        {input}
        {error && <HelpText id={errorId} tone="error">{error}</HelpText>}
        {hint && <HelpText id={hintId}>{hint}</HelpText>}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Both values render the same field. */
  variant?: "default" | "sandbox";
  /** Text, padding and corner from the control scale; the 120px well is unchanged. compact and touch remain. */
  size?: "default" | "sm" | "md" | "lg" | "compact" | "touch";
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    // `variant` is taken out so it never reaches the DOM element.
    {
      className, variant: _variant, size = "default", label, error, hint, id,
      "aria-describedby": describedBy, "aria-invalid": invalid, ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    const textarea = (
      <textarea
        id={textareaId}
        className={cn(
          "flex min-h-[120px] w-full resize-y border px-3 py-2",
          "placeholder:text-[var(--text-dim)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          fieldPresentation,
          fieldTouchText,
          size === "sm" ? cn(controlText.sm, controlRadius.sm, "px-2.5") : size === "lg" ? cn(controlText.lg, controlRadius.lg, "px-4 py-3") : cn(controlText.md, controlRadius.md),
          error && focusFieldInvalid,
          size === "compact" && "min-h-24 px-3 py-2",
          size === "touch" && "text-base",
          className,
        )}
        ref={ref}
        {...props}
        aria-describedby={descriptionIds(describedBy, hintId, errorId)}
        aria-invalid={error ? true : invalid}
      />
    );

    if (!label && !error && !hint) return textarea;

    return (
      <div className="w-full space-y-1.5">
        {label && <Label htmlFor={textareaId} className="block">{label}</Label>}
        {textarea}
        {error && <HelpText id={errorId} tone="error">{error}</HelpText>}
        {hint && <HelpText id={hintId}>{hint}</HelpText>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
