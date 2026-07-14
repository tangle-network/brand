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
  // Comments first: a block's own doc-comment routinely spells its selector out,
  // and anchoring on that prose would slice the wrong region — silently, since
  // the result still looks like CSS.
  const css = rulesOnly(source);
  // Tolerate any whitespace between selector and brace — a formatter that closes
  // the gap must not turn a passing suite into a "missing block" error.
  const open = new RegExp(`${escapeRegex(selector)}\\s*\\{`).exec(css);
  if (!open) throw new Error(`missing theme block: ${selector}`);
  const start = open.index;

  // Walk braces to find THIS block's close. Matching the first `}` would end the
  // block at the first nested rule's close instead (an `@media`, a nested
  // selector) — and the slice would still look like CSS, so assertions would run
  // against a truncated region rather than failing. Depth-counting is exact, and
  // an unterminated block throws instead of returning something plausible.
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(start, i);
    }
  }
  throw new Error(`unterminated theme block: ${selector}`);
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

/**
 * Read a hex surface token as WCAG relative luminance (0-1).
 *
 * Relative luminance, not HSL lightness: the ladder varies hue and saturation as
 * it rises, and HSL L is not perceptually uniform — two steps can share an L and
 * still read as different brightnesses, so an "is each plane brighter than the one
 * below" assertion made on HSL L would be measuring the wrong thing.
 *
 * Accepts `#rgb`, `#rrggbb` and `#rrggbbaa` (alpha is ignored — luminance is a
 * property of the color, not of how much of it you can see through). A token that
 * exists but is not hex reports exactly that, rather than claiming it is missing.
 */
export function hexRelativeLuminanceIn(css: string, token: string): number {
  const declaration = css.match(new RegExp(`--${token}:\\s*([^;]+)`));
  if (!declaration) throw new Error(`missing surface --${token}`);

  const value = declaration[1].trim();
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.exec(value);
  if (!hex) {
    throw new Error(
      `--${token} is not a hex color (found "${value}") — luminance is undefined for it`,
    );
  }

  const digits = hex[1];
  // #rgb is shorthand for #rrggbb; #rrggbbaa carries an alpha byte we drop.
  const pairs =
    digits.length === 3
      ? [...digits].map((d) => d + d)
      : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];

  const [r, g, b] = pairs.map((p) => Number.parseInt(p, 16) / 255);
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
