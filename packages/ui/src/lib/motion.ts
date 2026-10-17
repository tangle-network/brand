/** Brand motion roles contain duration AND easing; consume complete shorthands. */
export const controlMotion =
  "[transition:color_var(--motion-control),background-color_var(--motion-control),border-color_var(--motion-control),box-shadow_var(--motion-control),transform_var(--motion-control),scale_var(--motion-control),opacity_var(--motion-control)] motion-reduce:transition-none";

/** Radix presence markers carry the scoped role; SurfaceMotion owns interruptible geometry. */
export const surfaceMotion =
  "data-[state=open]:[animation:tangle-surface-present_var(--motion-surface)_both] data-[state=delayed-open]:[animation:tangle-surface-present_var(--motion-surface)_both] data-[state=instant-open]:[animation:tangle-surface-present_var(--motion-surface)_both] data-[state=closed]:[animation:tangle-surface-absent_var(--motion-dismiss)_both] motion-reduce:animate-none!";
