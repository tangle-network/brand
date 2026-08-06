/**
 * Helpers for asserting on the stylesheets as source text.
 *
 * Deliberately NOT a `.test.ts` file: importing one test file from another makes
 * Vitest register the imported file's top-level suites a second time, in the
 * importing file's context.
 */

/** Escape every regex metacharacter, so a selector is matched literally. */
function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip CSS comments, so a selector named in prose is never mistaken for a rule. */
function rulesOnly(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Extract a rule's body by selector, tolerant of formatting and of nesting. */
export function blockIn(source: string, selector: string): string {
  const blocks = blocksIn(source, selector);
  if (blocks.length === 0) throw new Error(`missing theme block: ${selector}`);
  return blocks[0];
}

/**
 * Every rule body whose selector list ENDS in `selector`, in source order — the
 * match requires the selector immediately before the `{`, so a selector earlier
 * in a comma-separated group (`selector, .other {`) is not returned.
 *
 * One selector can head MORE than one rule — `[data-theme="tangle-light"]` names
 * both the shared light-status override group and the theme's own block — so a
 * first-match read can silently slice the wrong region. Return them all and let
 * the caller pick (e.g. the one that declares `--hsl-background`).
 */
export function blocksIn(source: string, selector: string): string[] {
  // Comments first: a block's own doc-comment routinely spells its selector out,
  // and anchoring on that prose would slice the wrong region — silently, since
  // the result still looks like CSS.
  const css = rulesOnly(source);
  // Tolerate any whitespace between selector and brace — a formatter that closes
  // the gap must not turn a passing suite into a "missing block" error.
  const pattern = new RegExp(`${escapeRegex(selector)}\\s*\\{`, "g");

  const blocks: string[] = [];
  for (const open of css.matchAll(pattern)) {
    const start = open.index;

    // Walk braces to find THIS block's close. Matching the first `}` would end the
    // block at the first nested rule's close instead (an `@media`, a nested
    // selector) — and the slice would still look like CSS, so assertions would run
    // against a truncated region rather than failing. Depth-counting is exact, and
    // an unterminated block throws instead of returning something plausible.
    let depth = 0;
    let closed = false;
    for (let i = css.indexOf("{", start); i < css.length; i++) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          blocks.push(css.slice(start, i));
          closed = true;
          break;
        }
      }
    }
    if (!closed) throw new Error(`unterminated theme block: ${selector}`);
  }
  return blocks;
}

/** Read a token's raw declaration value, whitespace-normalized. */
export function declIn(css: string, token: string): string {
  const m = css.match(new RegExp(`--${token}:\\s*([^;]+)`));
  if (!m) throw new Error(`missing token --${token}`);
  return m[1].trim().replace(/\s+/g, " ");
}

/** Read an `H S% L%` channel triple. */
export function hslIn(
  css: string,
  token: string,
): { h: number; s: number; l: number } {
  const m = css.match(
    new RegExp(
      `--${token}:\\s*(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)%\\s+(\\d+(?:\\.\\d+)?)%`,
    ),
  );
  if (!m) throw new Error(`missing HSL slot --${token}`);
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

type Rgb = [number, number, number];

/**
 * Read a hex surface token as RGB 0-255.
 *
 * Accepts `#rgb`, `#rrggbb` and `#rrggbbaa` (alpha is dropped — compositing is a
 * separate question, answered by `compositeOver`). A token that exists but is not
 * hex reports exactly that, rather than claiming it is missing.
 */
export function hexIn(css: string, token: string): Rgb {
  const declaration = css.match(new RegExp(`--${token}:\\s*([^;]+)`));
  if (!declaration) throw new Error(`missing surface --${token}`);

  const value = declaration[1].trim();
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.exec(value);
  if (!hex) {
    throw new Error(`--${token} is not a hex color (found "${value}")`);
  }

  const digits = hex[1];
  // #rgb is shorthand for #rrggbb; #rrggbbaa carries an alpha byte we drop.
  const pairs =
    digits.length === 3
      ? [...digits].map((d) => d + d)
      : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];
  return pairs.map((p) => Number.parseInt(p, 16)) as Rgb;
}

/** `H S% L%` → RGB 0-255. */
export function hslToRgb({
  h,
  s,
  l,
}: {
  h: number;
  s: number;
  l: number;
}): Rgb {
  const sat = s / 100;
  const lit = l / 100;
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lit - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * What a translucent foreground actually becomes once the surface behind it shows
 * through. A `/70` utility does not render the token's color — it renders this.
 */
export function compositeOver(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((c, i) => alpha * c + (1 - alpha) * bg[i]) as Rgb;
}

/** WCAG contrast ratio between two opaque colors. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Read a hex surface token as WCAG relative luminance (0-1).
 *
 * Relative luminance, not HSL lightness: the ladder varies hue and saturation as
 * it rises, and HSL L is not perceptually uniform — two steps can share an L and
 * still read as different brightnesses, so an "is each plane brighter than the one
 * below" assertion made on HSL L would be measuring the wrong thing. Hex parsing
 * (and its error reporting) is `hexIn`'s.
 */
export function hexRelativeLuminanceIn(css: string, token: string): number {
  return relativeLuminance(hexIn(css, token));
}
