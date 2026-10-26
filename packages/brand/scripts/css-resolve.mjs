// Reads a stylesheet's custom properties as data: one block's declarations, and
// a token's concrete value through its var() aliases. Shared by the generators
// (gen-ladders, gen-palette) and the style tests, so every reader of tokens.css
// resolves an alias the same way the browser does: a name declared in the block
// wins, and a name it inherits comes from the canonical baseline.

/** The body of the first rule whose selector list ends with `last` (the selector the brace follows). */
export function block(css, last) {
  const re = new RegExp(`${last.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "g");
  const m = re.exec(css);
  if (!m) throw new Error(`no block for ${last}`);
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  for (; i < css.length && depth; i++) depth += css[i] === "{" ? 1 : css[i] === "}" ? -1 : 0;
  return css.slice(start, i - 1);
}

/** `--name: value;` pairs of a rule body, comments stripped, later declarations winning. */
export function decls(body) {
  const out = {};
  for (const m of body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

/** `H S% L%` → `#rrggbb`. */
export function hslHex(h, s, l) {
  s /= 100;
  l /= 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

const TRIPLE = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/;

/**
 * A token's value with every alias followed: `var(--x)` chains and
 * `hsl(var(--x))` wrappers. Returns an `H S% L%` triple, a hex colour, or any
 * other concrete value (rgba, color-mix, a gradient) as written. `scope` is the
 * block being read; `baseline` is what it inherits, consulted per hop so a
 * light block's alias to a dark-declared token still picks up the light leaf.
 */
export function resolveValue(scope, name, baseline = {}, seen = new Set()) {
  if (seen.has(name)) throw new Error(`cycle at --${name}`);
  seen.add(name);
  const v = scope[name] ?? baseline[name];
  if (v == null) throw new Error(`--${name} is not defined`);
  const ref = v.match(/^var\(--([a-z0-9-]+)\)$/);
  if (ref) return resolveValue(scope, ref[1], baseline, seen);
  const wrapped = v.match(/^hsl\(var\(--([a-z0-9-]+)\)\)$/);
  if (wrapped) {
    const inner = resolveValue(scope, wrapped[1], baseline, seen);
    const tri = inner.match(TRIPLE);
    return tri ? hslHex(+tri[1], +tri[2], +tri[3]) : inner;
  }
  return v;
}

/** `resolveValue`, then a hex colour or a thrown error: triples convert, anything else is refused. */
export function resolveHex(scope, name, baseline = {}) {
  const v = resolveValue(scope, name, baseline);
  const tri = v.match(TRIPLE);
  if (tri) return hslHex(+tri[1], +tri[2], +tri[3]);
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return ("#" + [...v.slice(1)].map((c) => c + c).join("")).toLowerCase();
  throw new Error(`--${name}: "${v}" is not a solid colour`);
}
