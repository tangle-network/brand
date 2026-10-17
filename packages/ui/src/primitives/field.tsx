"use client";

import { CircleAlert } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { InfoTip } from "./info-tip";
import { Label } from "./label";

export interface FieldProps {
  label: string;
  /** The control's id; the label targets it. */
  htmlFor: string;
  /** Help that explains what the setting does, shown from an info button. */
  info?: React.ReactNode;
  /** One short sentence the person needs to fill the field in. */
  hint?: React.ReactNode;
  /** A validation error. The control should set `aria-invalid` and reference {@link fieldMessageId}. */
  error?: React.ReactNode;
  /** A non-error status, such as a check that passed. */
  status?: React.ReactNode;
  /** Trailing content in the label row, such as a "Use default" action. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** The id of a field's hint, error, or status line, for the control's `aria-describedby`. */
export function fieldMessageId(htmlFor: string): string {
  return `${htmlFor}-message`;
}

/**
 * A labelled form field: the label (with an optional info tip and a trailing
 * aside) above the control, and one message line under it. Every line is
 * 14px; an error replaces the status and the hint and is announced.
 */
export function Field({ label, htmlFor, info, hint, error, status, aside, children }: FieldProps) {
  const message = error ?? status ?? hint;
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <Label htmlFor={htmlFor} className="leading-6 text-foreground">{label}</Label>
          {info && <InfoTip label={label}>{info}</InfoTip>}
        </span>
        {aside}
      </div>
      {children}
      {message && (
        <div
          id={fieldMessageId(htmlFor)}
          role={error ? "alert" : undefined}
          className={cn(
            "text-sm leading-6 [overflow-wrap:anywhere]",
            error ? "flex items-start gap-1.5 text-[var(--surface-danger-text)]" : "text-muted-foreground",
          )}
        >
          {error && <CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />}
          {error ? <span className="min-w-0">{message}</span> : message}
        </div>
      )}
    </div>
  );
}
