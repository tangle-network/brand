/**
 * Helpers for asserting on the stylesheets as source text.
 *
 * Deliberately NOT a `.test.ts` file: importing one test file from another makes
 * Vitest register the imported file's top-level suites a second time, in the
 * importing file's context.
 */

/** Extract a rule's body by selector, tolerant of formatting. */
export function blockIn(css: string, selector: string): string {
  // Tolerate any whitespace between selector and brace — a formatter that closes
  // the gap must not turn a passing suite into a "missing block" error.
  const open = new RegExp(`${selector.replace(/[.[\]"=]/g, "\\$&")}\\s*\\{`).exec(
    css,
  );
  if (!open) throw new Error(`missing theme block: ${selector}`);
  const start = open.index;
  // Find the block's real end. A bare `indexOf("\n}")` returns -1 when the brace
  // is indented, and `slice(start, -1)` would then hand back nearly the whole
  // stylesheet — assertions would pass or fail against the wrong text instead of
  // failing loudly. Match the closing brace at any indent, and throw if absent.
  const close = /\n[ \t]*\}/.exec(css.slice(start));
  if (!close) throw new Error(`unterminated theme block: ${selector}`);
  return css.slice(start, start + close.index);
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

/** Read a `#rrggbb` surface token as a 0-1 lightness. */
export function hexLightnessIn(css: string, token: string): number {
  const m = css.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`missing surface --${token}`);
  const hex = m[1];
  const [r, g, b] = [1, 3, 5].map(
    (i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}
