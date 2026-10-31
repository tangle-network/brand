import { Check, ChevronLeft } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

/**
 * A multi-step flow — onboarding, connection setup, anything where a person
 * should see one decision at a time.
 *
 * The library owns the chrome (step rail, progress, footer); each step owns
 * its content and its primary action. That separation is the point: products
 * stop rebuilding stepper markup with drifting styles, and a person gets the
 * same rhythm — one screen, one obvious action — in every Tangle app.
 *
 * Composition (DOM order is the step order):
 *
 * ```tsx
 * <Wizard onFinished={() => navigate("/done")}>
 *   <Wizard.Step title="Number" nextLabel="Continue">…</Wizard.Step>
 *   <Wizard.Step title="Verify" nextLabel="I replied" onNext={() => check()}>…</Wizard.Step>
 *   <Wizard.Step title="Done" nextLabel="Finish">…</Wizard.Step>
 * </Wizard>
 * ```
 *
 * - **Uncontrolled by default**; pass `step` to drive it (a background poll
 *   can jump straight to Done). `onStepChange` mirrors every move.
 * - **The step names its action.** `nextLabel` renders the footer's primary
 *   button; an async `onNext` shows `loading` and advances only on resolve,
 *   so failures keep the person on the step with the app's inline error.
 *   Omit `nextLabel` for steps whose content renders its own actions.
 * - **Forward is earned, backward is free.** Future steps are not clickable;
 *   past steps are (people re-check earlier choices mid-flow).
 * - **Mobile is a first-class shape**, not a squeezed desktop: below `sm` the
 *   rail collapses to "Step 2 of 3 · Verify" and a thin progress bar.
 *
 * Wizard renders no card — compose it inside a `Card` when the surface needs
 * one, so containers-within-containers stay a choice, not a default.
 */

interface WizardContextValue {
  current: number;
  total: number;
  goTo: (step: number) => void;
  next: () => void;
  back: () => void;
  /** Set by Wizard: fires onFinished when the final step's action resolves. */
  finish: () => void;
}

const WizardContext = React.createContext<WizardContextValue | null>(null);

function useWizardContext(component: string): WizardContextValue {
  const context = React.useContext(WizardContext);
  if (!context) throw new Error(`<${component}> must be used inside <Wizard>`);
  return context;
}

export interface WizardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Drives the active step; omit for uncontrolled with `defaultStep`. */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Fires when the last step's primary action resolves. */
  onFinished?: () => void;
}

export function Wizard({ children, step, defaultStep = 0, onStepChange, onFinished, className, ...rest }: WizardProps) {
  const steps = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<WizardStepProps>[];
  const [internal, setInternal] = React.useState(defaultStep);
  const current = step !== undefined ? step : internal;
  const total = steps.length;

  const goTo = React.useCallback((target: number) => {
    const bounded = Math.max(0, Math.min(target, total - 1));
    if (bounded === current) return;
    onStepChange?.(bounded);
    if (step === undefined) setInternal(bounded);
  }, [current, onStepChange, step, total]);

  const context = React.useMemo<WizardContextValue>(() => ({
    current,
    total,
    goTo,
    next: () => goTo(current + 1),
    back: () => goTo(current - 1),
    finish: () => onFinished?.(),
  }), [current, goTo, onFinished, total]);

  const titles = steps.map(child => child.props.title);
  const activeTitle = titles[current] ?? "";

  return (
    <WizardContext.Provider value={context}>
      <div className={cn("w-full", className)} {...rest}>
        {/* Desktop rail. */}
        <ol aria-label="Steps" className="hidden items-center gap-2 sm:flex">
          {titles.map((title, index) => {
            const state = index < current ? "done" : index === current ? "active" : "future";
            const marker = (
              <>
                <span className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  state === "active" && "bg-primary text-primary-foreground",
                  state === "done" && "bg-primary/15 text-primary",
                  state === "future" && "bg-muted text-muted-foreground",
                )}>
                  {state === "done" ? <Check className="size-3.5" aria-hidden /> : index + 1}
                </span>
                <span className={cn(
                  "text-sm",
                  state === "active" && "font-medium text-foreground",
                  state === "done" && "text-foreground",
                  state === "future" && "text-muted-foreground",
                )}>{title}</span>
              </>
            );
            return (
              <React.Fragment key={`${index}-${title}`}>
                {index > 0 && <li aria-hidden className="h-px flex-1 bg-border" />}
                <li>
                  {state === "future"
                    ? <span aria-disabled="true" className="flex items-center gap-2 p-1 opacity-70">{marker}</span>
                    : <button type="button" onClick={() => goTo(index)}
                        className="-m-1 flex items-center gap-2 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {marker}
                      </button>}
                </li>
              </React.Fragment>
            );
          })}
        </ol>
        {/* Mobile: position + progress, not a squeezed rail. */}
        <div className="sm:hidden">
          <p className="text-xs text-muted-foreground">
            Step {current + 1} of {total} · <span className="font-medium text-foreground">{activeTitle}</span>
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" role="progressbar"
            aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={`Step ${current + 1} of ${total}`}>
            <div className="h-full w-full rounded-full bg-primary transition-transform duration-300 ease-out" style={{ transform: `translateX(-${100 - ((current + 1) / total) * 100}%)` }} />
          </div>
        </div>
        {steps.map((child, index) => index === current
          ? <React.Fragment key={index}>{child}</React.Fragment>
          : null)}
      </div>
    </WizardContext.Provider>
  );
}

export interface WizardStepProps {
  /** Shown in the rail (and the mobile position line). Steps read at a glance; keep it one or two words. */
  title: string;
  children: React.ReactNode;
  /** The footer's primary action label. Omit when the step renders its own actions. */
  nextLabel?: string;
  /** Runs before advancing. Resolve (or return a non-false value) to advance; return false or throw to stay — the step's own content shows why. */
  onNext?: () => Promise<unknown> | unknown;
  /** Disables the primary action (a required choice is still missing). */
  nextDisabled?: boolean;
  /** Hides the Back button for steps where going back makes no sense (a completed handshake). */
  hideBack?: boolean;
}

export function WizardStep({ title, children, nextLabel, onNext, nextDisabled, hideBack }: WizardStepProps) {
  const { current, total, goTo, back, finish } = useWizardContext("Wizard.Step");
  const [busy, setBusy] = React.useState(false);
  const isLast = current === total - 1;

  async function runNext() {
    if (!onNext) {
      if (isLast) finish(); else goTo(current + 1);
      return;
    }
    setBusy(true);
    try {
      const result = await onNext();
      if (result === false) return;
      if (isLast) finish(); else goTo(current + 1);
    } catch {
      // Stay on the step; its content owns the error presentation. A rejected
      // promise here must not surface as an unhandled flow crash.
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label={title} className="pt-6">
      {children}
      {(nextLabel || !hideBack) && (
        <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
          {!hideBack && current > 0
            ? <Button type="button" variant="ghost" onClick={back}><ChevronLeft className="size-4" aria-hidden /> Back</Button>
            : <span />}
          {nextLabel && (
            <Button type="button" className="w-full sm:w-auto" onClick={() => void runNext()} disabled={nextDisabled} loading={busy}>
              {nextLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

// Dot-notation composition (`<Wizard.Step>`), attached after both definitions
// so each keeps a plain, tree-shakeable named export.
export interface Wizard extends React.FC<WizardProps> {
  Step: typeof WizardStep;
}
(Wizard as Wizard).Step = WizardStep;
