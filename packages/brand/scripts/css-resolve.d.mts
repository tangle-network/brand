/** Types for css-resolve.mjs, which the style tests import from TypeScript. */
export function block(css: string, last: string): string;
export function decls(body: string): Record<string, string>;
export function hslHex(h: number, s: number, l: number): string;
export function resolveValue(
  scope: Record<string, string>,
  name: string,
  baseline?: Record<string, string>,
  seen?: Set<string>,
): string;
export function resolveHex(scope: Record<string, string>, name: string, baseline?: Record<string, string>): string;
