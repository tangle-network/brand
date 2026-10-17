import * as React from "react";
import { knot, knotGradientIds } from "./knot.js";

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  suffix?: string | null;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 24, text: "text-base", suffix: "text-xs", gap: "gap-1.5" },
  md: { icon: 28, text: "text-lg", suffix: "text-sm", gap: "gap-2" },
  lg: { icon: 36, text: "text-2xl", suffix: "text-base", gap: "gap-2.5" },
  xl: { icon: 48, text: "text-3xl", suffix: "text-lg", gap: "gap-3" },
} as const;

export interface TangleKnotProps {
  size?: number;
  className?: string;
  /** Omit for a decorative mark. Supply a name when the mark conveys identity. */
  label?: string;
}

export function TangleKnot({size = 32, className, label = "Tangle"}: TangleKnotProps) {
  const uid = React.useId();
  const ids = knotGradientIds(`tk-${uid}`);
  return <svg width={size} height={size} viewBox={knot.viewBox} fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} focusable="false"
    role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={!label || undefined}>
    {label && <title>{label}</title>}
    <defs>{knot.gradients.map((g,i)=><linearGradient key={ids[i]} id={ids[i]} {...g} gradientUnits="userSpaceOnUse">
      {knot.stops.map((color,index)=><stop key={color} offset={index} stopColor={color}/>)}
    </linearGradient>)}</defs>
    {knot.paths.map((path,i)=><path key={i} {...path} fill={`url(#${ids[i]})`}/>)}
  </svg>;
}

export function Logo({
  size = "md",
  variant = "full",
  suffix = null,
  className,
}: LogoProps) {
  const cfg = sizeConfig[size];

  if (variant === "icon") {
    return <TangleKnot size={cfg.icon} className={className} />;
  }

  const cls = ["flex items-center", cfg.gap, className].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <TangleKnot size={cfg.icon} className="shrink-0" />
      <div className="flex items-baseline gap-1">
        <span className={`font-bold tracking-tight ${cfg.text}`}>Tangle</span>
        {suffix ? (
          <span className={`font-medium text-gradient-brand ${cfg.suffix}`}>{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
