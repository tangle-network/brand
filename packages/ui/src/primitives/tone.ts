/**
 * Categorical tones: the colours that tell KINDS of things apart — an entity,
 * a file type, a channel, a capability. A category never reports a state; that
 * is `StatusPill`'s job, on its own success / warning / danger / info / neutral
 * triples. See "Color Roles" in the brand guidelines.
 *
 * Each tone reads one matched family from `@tangle-network/brand`
 * (`--tone-<name>-{bg,bg-hover,bg-selected,border,border-selected,text,icon}`),
 * solved so the text and icon clear their floors on every fill in both themes.
 *
 * Every class below is written out in full: Tailwind and the sandbox-ui style
 * bundle read this file statically, so an interpolated class name would never
 * be generated.
 */

export const CATEGORY_TONES = [
  "violet",
  "orange",
  "teal",
  "blue",
  "pink",
  "brown",
  "cyan",
  "lime",
] as const;

export type CategoryTone = (typeof CATEGORY_TONES)[number];

/** A categorical tone, or `neutral` for a label that is not a category. */
export type Tone = CategoryTone | "neutral";

export interface ToneClasses {
  /** Resting fill, border and label colour. */
  surface: string;
  /** Border only; the label keeps the tone's text colour. */
  outline: string;
  /** Hover fill for an interactive surface. */
  hover: string;
  /** Fill and border of a selected chip. */
  selected: string;
  /** The glyph colour, for an icon beside a label or inside a tile. */
  icon: string;
}

export const TONE_CLASSES: Record<Tone, ToneClasses> = {
  violet: {
    surface: "border-[var(--tone-violet-border)] bg-[var(--tone-violet-bg)] text-[var(--tone-violet-text)]",
    outline: "border-[var(--tone-violet-border)] bg-transparent text-[var(--tone-violet-text)]",
    hover: "hover:bg-[var(--tone-violet-bg-hover)]",
    selected: "border-[var(--tone-violet-border-selected)] bg-[var(--tone-violet-bg-selected)]",
    icon: "text-[var(--tone-violet-icon)]",
  },
  orange: {
    surface: "border-[var(--tone-orange-border)] bg-[var(--tone-orange-bg)] text-[var(--tone-orange-text)]",
    outline: "border-[var(--tone-orange-border)] bg-transparent text-[var(--tone-orange-text)]",
    hover: "hover:bg-[var(--tone-orange-bg-hover)]",
    selected: "border-[var(--tone-orange-border-selected)] bg-[var(--tone-orange-bg-selected)]",
    icon: "text-[var(--tone-orange-icon)]",
  },
  teal: {
    surface: "border-[var(--tone-teal-border)] bg-[var(--tone-teal-bg)] text-[var(--tone-teal-text)]",
    outline: "border-[var(--tone-teal-border)] bg-transparent text-[var(--tone-teal-text)]",
    hover: "hover:bg-[var(--tone-teal-bg-hover)]",
    selected: "border-[var(--tone-teal-border-selected)] bg-[var(--tone-teal-bg-selected)]",
    icon: "text-[var(--tone-teal-icon)]",
  },
  blue: {
    surface: "border-[var(--tone-blue-border)] bg-[var(--tone-blue-bg)] text-[var(--tone-blue-text)]",
    outline: "border-[var(--tone-blue-border)] bg-transparent text-[var(--tone-blue-text)]",
    hover: "hover:bg-[var(--tone-blue-bg-hover)]",
    selected: "border-[var(--tone-blue-border-selected)] bg-[var(--tone-blue-bg-selected)]",
    icon: "text-[var(--tone-blue-icon)]",
  },
  pink: {
    surface: "border-[var(--tone-pink-border)] bg-[var(--tone-pink-bg)] text-[var(--tone-pink-text)]",
    outline: "border-[var(--tone-pink-border)] bg-transparent text-[var(--tone-pink-text)]",
    hover: "hover:bg-[var(--tone-pink-bg-hover)]",
    selected: "border-[var(--tone-pink-border-selected)] bg-[var(--tone-pink-bg-selected)]",
    icon: "text-[var(--tone-pink-icon)]",
  },
  brown: {
    surface: "border-[var(--tone-brown-border)] bg-[var(--tone-brown-bg)] text-[var(--tone-brown-text)]",
    outline: "border-[var(--tone-brown-border)] bg-transparent text-[var(--tone-brown-text)]",
    hover: "hover:bg-[var(--tone-brown-bg-hover)]",
    selected: "border-[var(--tone-brown-border-selected)] bg-[var(--tone-brown-bg-selected)]",
    icon: "text-[var(--tone-brown-icon)]",
  },
  cyan: {
    surface: "border-[var(--tone-cyan-border)] bg-[var(--tone-cyan-bg)] text-[var(--tone-cyan-text)]",
    outline: "border-[var(--tone-cyan-border)] bg-transparent text-[var(--tone-cyan-text)]",
    hover: "hover:bg-[var(--tone-cyan-bg-hover)]",
    selected: "border-[var(--tone-cyan-border-selected)] bg-[var(--tone-cyan-bg-selected)]",
    icon: "text-[var(--tone-cyan-icon)]",
  },
  lime: {
    surface: "border-[var(--tone-lime-border)] bg-[var(--tone-lime-bg)] text-[var(--tone-lime-text)]",
    outline: "border-[var(--tone-lime-border)] bg-transparent text-[var(--tone-lime-text)]",
    hover: "hover:bg-[var(--tone-lime-bg-hover)]",
    selected: "border-[var(--tone-lime-border-selected)] bg-[var(--tone-lime-bg-selected)]",
    icon: "text-[var(--tone-lime-icon)]",
  },
  // Neutral is the chrome greys, not a ramp: the nested-well fill, the subtle
  // hairline, muted text. Hover and selected step toward the ink so they stay
  // grey in every named theme; the selected border is the dim text tier, which
  // clears 3:1 on the well in both themes.
  neutral: {
    surface: "border-[var(--surface-neutral-border)] bg-[var(--surface-neutral-bg)] text-[var(--text-secondary)]",
    outline: "border-[var(--border-default)] bg-transparent text-[var(--text-secondary)]",
    hover: "hover:bg-[color-mix(in_srgb,var(--surface-neutral-bg),var(--text-primary)_6%)]",
    selected:
      "border-[var(--text-dim)] bg-[color-mix(in_srgb,var(--surface-neutral-bg),var(--text-primary)_12%)] text-[var(--text-primary)]",
    icon: "text-[var(--text-dim)]",
  },
};

/**
 * A stable categorical tone for a key — an account id, a channel, a project
 * name — for things that need telling apart but have no category of their own.
 * The same key always gets the same tone, in every product and session.
 * Distinct keys can share a tone, so the label or glyph must still name it.
 */
export function toneFor(key: string): CategoryTone {
  // FNV-1a: a few lines, no dependency, and well spread over short strings.
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return CATEGORY_TONES[(hash >>> 0) % CATEGORY_TONES.length];
}
