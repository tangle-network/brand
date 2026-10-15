"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { animate } from "motion";

type Side = "top" | "right" | "bottom" | "left";
type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  kind: "dialog" | "sheet" | "overlay" | "tooltip";
  side?: Side;
  asChild?: boolean;
  "data-state"?: string;
};

/** Radix owns state, focus and presence; Motion only retargets the visible object. */
export const SurfaceMotion = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ kind, side = "right", asChild, "data-state": state, ...props }, forwardedRef) => {
    const element = React.useRef<HTMLDivElement | null>(null);
    const initialized = React.useRef(false);
    const controls = React.useRef<ReturnType<typeof animate> | undefined>(undefined);
    const ref = React.useCallback<React.RefCallback<HTMLDivElement>>((node) => {
      element.current = node;
      if (typeof forwardedRef === "function") {
        const cleanup = forwardedRef(node);
        if (typeof cleanup === "function") return () => { element.current = null; cleanup(); };
      } else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    React.useLayoutEffect(() => {
      const node = element.current;
      if (!node) return;
      const preference = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
      const run = () => {
        const closed = state === "closed";
        const bounds = node.getBoundingClientRect();
        const hidden = {
          opacity: kind === "sheet" ? 1 : 0,
          scale: kind === "dialog" || kind === "tooltip" ? 0.98 : 1,
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
        // Missing styles and reduced motion settle synchronously. No semantic
        // transition waits for a JavaScript completion callback.
        if (preference?.matches || seconds <= 0 || style.animationName === "none") {
          controls.current?.stop();
          place(target);
          if (initialized.current) controls.current = animate(node, target, { duration: 0 });
          return;
        }
        if (!initialized.current) { place(hidden); initialized.current = true; }
        // Critically damped response: <0.01% residual at the role's deadline.
        // Reusing this element's Motion values preserves position and velocity
        // on reversal; a duration-based spring would discard velocity.
        const frequency = 12 / seconds;
        controls.current = animate(node, target, {
          type: "spring", stiffness: frequency * frequency, damping: 2 * frequency,
          restDelta: 0.001, restSpeed: 0.01,
        });
      };
      run();
      preference?.addEventListener("change", run);
      return () => preference?.removeEventListener("change", run);
    }, [state, kind, side]);
    React.useEffect(() => () => controls.current?.stop(), []);
    const Component = asChild ? Slot : "div";
    return <Component {...props} data-state={state} ref={ref} />;
  },
);
SurfaceMotion.displayName = "SurfaceMotion";
