"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { animate, motionValue, styleEffect, type MotionValue } from "motion";

type Side = "top" | "right" | "bottom" | "left";
type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  kind: "dialog" | "sheet" | "overlay" | "tooltip" | "popover";
  side?: Side;
  asChild?: boolean;
  "data-state"?: string;
};

/** Radix owns state and focus; visual retirement cannot wait for a CSS event. */
export const SurfaceMotion = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ kind, side = "right", asChild, "data-state": state, ...props }, forwardedRef) => {
    const element = React.useRef<HTMLDivElement | null>(null);
    const [retired, setRetired] = React.useState(false);
    const values = React.useRef<Record<"opacity" | "scale" | "x" | "y", MotionValue<number>> | null>(null);
    const controls = React.useRef<Array<ReturnType<typeof animate>>>([]);
    const ref = React.useCallback<React.RefCallback<HTMLDivElement>>((node) => {
      element.current = node;
      if (typeof forwardedRef === "function") {
        const cleanup: unknown = forwardedRef(node);
        if (typeof cleanup === "function") return () => { element.current = null; cleanup(); };
      } else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    React.useLayoutEffect(() => {
      const node = element.current;
      if (!node) return;
      const preference = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
      let cancelRender: (() => void) | undefined;
      let retirement: ReturnType<typeof setTimeout> | undefined;
      const run = () => {
        clearTimeout(retirement);
        setRetired(false);
        const closed = state === "closed";
        const bounds = node.getBoundingClientRect();
        const hidden = {
          opacity: kind === "sheet" ? 1 : 0,
          scale: kind === "dialog" || kind === "tooltip" || kind === "popover" ? 0.98 : 1,
          x: kind === "sheet" ? side === "left" ? -bounds.width : side === "right" ? bounds.width : 0 : 0,
          y: kind === "sheet" ? side === "top" ? -bounds.height : side === "bottom" ? bounds.height : 0 : 0,
        };
        const target = closed ? hidden : { opacity: 1, scale: 1, x: 0, y: 0 };
        const style = getComputedStyle(node);
        // The nonvisual marker resolves the full role, including scoped calc().
        const time = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(style.animationDuration.split(",")[0]!.trim());
        const seconds = time ? Number(time[1]) / (time[2] === "ms" ? 1000 : 1) : 0;
        const place = (value: typeof target) => {
          node.style.opacity = String(value.opacity);
          node.style.transform = `translateX(${value.x}px) translateY(${value.y}px) scale(${value.scale})`;
        };
        // Radix may retain an exit until animationend. Retire this DOM node at
        // the scoped deadline even when keyframes/events are missing or paused;
        // its null ref lets Radix release presence, focus and modal resources.
        // Reopen cancels retirement and keeps the same node and Motion values.
        if (closed) {
          if (preference?.matches || seconds <= 0 || style.animationName === "none") setRetired(true);
          else retirement = setTimeout(() => setRetired(true), seconds * 1000);
        }
        // Missing styles and reduced motion settle synchronously. No semantic
        // transition waits for a JavaScript completion callback.
        if (preference?.matches || seconds <= 0 || style.animationName === "none") {
          controls.current.forEach(control => control.stop());
          if (values.current) for (const key of ["opacity", "scale", "x", "y"] as const) values.current[key].jump(target[key]);
          place(target);
          return;
        }
        if (!values.current) {
          place(hidden);
          values.current = { opacity: motionValue(hidden.opacity), scale: motionValue(hidden.scale), x: motionValue(hidden.x), y: motionValue(hidden.y) };
        }
        cancelRender ??= styleEffect(node, values.current);
        // Critically damped response: <0.01% residual at the role's deadline.
        // Explicit values keep every channel on the same frame clock, including
        // opacity, without resampling a compositor animation on reversal.
        const frequency = 12 / seconds;
        controls.current = (["opacity", "scale", "x", "y"] as const).map(key => animate(values.current![key], target[key], {
          type: "spring", stiffness: frequency * frequency, damping: 2 * frequency,
          restDelta: 0.001, restSpeed: 0.01,
        }));
      };
      run();
      preference?.addEventListener("change", run);
      return () => { clearTimeout(retirement); preference?.removeEventListener("change", run); cancelRender?.(); };
    // Radix Popper temporarily suppresses animation until placement resolves.
    // Start the same retained values when that inline override clears.
    }, [state, kind, side, props.style?.animation]);
    React.useEffect(() => () => controls.current.forEach(control => control.stop()), []);
    const Component = asChild ? Slot : "div";
    return state === "closed" && retired ? null : <Component {...props} data-state={state} ref={ref} />;
  },
);
SurfaceMotion.displayName = "SurfaceMotion";
