import * as React from "react";
import { cn } from "../lib/utils";
import { type CategoryTone, TONE_CLASSES, toneFor } from "./tone";

/**
 * A square identity mark for a row or card: a project, a channel, an account,
 * a file kind. It shows the first of these that is available:
 *
 * 1. `src` — an image (a logo or favicon). If it fails to load, the tile falls
 *    through to the next option instead of showing a broken image.
 * 2. `icon` — a glyph, drawn in the tone's icon colour.
 * 3. `name` — up to two initials.
 *
 * The tone is categorical. Omit it to derive a stable one from `name`, so the
 * same project gets the same colour on every screen. A tile is decorative
 * unless `label` is given: next to a visible name it would only repeat it.
 */
export interface IconTileProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Defaults to a tone derived from `name`, or violet when there is no name. */
  tone?: CategoryTone;
  size?: "xs" | "sm" | "md" | "lg";
  src?: string;
  icon?: React.ReactNode;
  /** The thing's name. Supplies the initials and the derived tone. */
  name?: string;
  /** Accessible name. Give it only when no visible label names the thing. */
  label?: string;
}

const SIZE = {
  xs: "size-5 rounded-[5px] text-[10px] [&_svg]:size-3",
  sm: "size-6 rounded-md text-[11px] [&_svg]:size-3.5",
  md: "size-8 rounded-md text-xs [&_svg]:size-4",
  lg: "size-10 rounded-lg text-sm [&_svg]:size-5",
} as const;

/** Up to two initials: the first letters of the first two words, or of the one word. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/[\s._-]+/u).filter(Boolean);
  if (words.length === 0) return "";
  // Array.from splits by code point, so an emoji or astral letter stays whole.
  const first = (word: string) => Array.from(word)[0] ?? "";
  const letters = words.length === 1 ? Array.from(words[0]).slice(0, 2).join("") : first(words[0]) + first(words[1]);
  return letters.toLocaleUpperCase();
}

const IconTile = React.forwardRef<HTMLSpanElement, IconTileProps>(
  ({ className, tone, size = "md", src, icon, name, label, ...props }, ref) => {
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
    const resolvedTone = tone ?? (name ? toneFor(name) : "violet");
    const classes = TONE_CLASSES[resolvedTone];
    const showImage = Boolean(src) && failedSrc !== src;
    const initials = name ? initialsOf(name) : "";
    return (
      <span
        ref={ref}
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center overflow-hidden border font-semibold leading-none",
          SIZE[size],
          showImage ? "border-[var(--border-subtle)] bg-[var(--surface-neutral-bg)]" : classes.surface,
          !showImage && icon ? classes.icon : null,
          className,
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt=""
            className="size-full object-cover"
            onError={() => setFailedSrc(src ?? null)}
            draggable={false}
          />
        ) : icon ? (
          icon
        ) : (
          initials
        )}
      </span>
    );
  },
);
IconTile.displayName = "IconTile";

export { IconTile };
