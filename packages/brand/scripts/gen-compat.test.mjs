import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import postcss from "postcss";
import { checkCompatibility, generateCompatibility } from "./gen-compat.mjs";

const styles = new URL("../src/styles/", import.meta.url);
const tokens = readFileSync(new URL("tokens.css", styles), "utf8");
const named = readFileSync(new URL("named-themes.css", styles), "utf8");
const generated = readFileSync(new URL("legacy-light.css", styles), "utf8");
const declarations = (css) => {
  const result = [];
  postcss.parse(css).walkDecls((decl) => {
    if (decl.prop !== "--radius") result.push([decl.prop, decl.value]);
  });
  return result;
};

test("checked-in projection is byte-for-byte current; stale output is rejected", () => {
  const expected = generateCompatibility(tokens, named);
  checkCompatibility(expected, generated);
  assert.throws(() => checkCompatibility(expected, generated + "\n"), /Stale/);
});

test("every declaration derives from canonical CSS, except the host-owned --radius", () => {
  assert.deepEqual(declarations(generated), declarations(`${tokens}\n${named}`));
  assert.doesNotMatch(generated, /--radius\s*:/);
  assert.doesNotMatch(generated, /@import|ladders\.css|system\.css/);
});

for (const property of ["--hsl-background", "--syntax-keyword", "--font-sans", "--radius-md", "--duration-fast"]) {
  test(`${property}: a canonical edit changes the projection, not a second palette`, () => {
    const source = postcss.parse(tokens);
    let changed = false;
    source.walkDecls(property, (decl) => {
      if (!changed) { decl.value = "var(--proof-sentinel)"; changed = true; }
    });
    assert.ok(changed);
    const next = generateCompatibility(source.toString(), named);
    assert.notEqual(next, generated);
    assert.deepEqual(declarations(next), declarations(`${source}\n${named}`));
    assert.throws(() => checkCompatibility(next, generated), /Stale/);
  });
}

test("named theme edits also invalidate and regenerate the compatibility artifact", () => {
  const source = postcss.parse(named);
  source.walkDecls("--hsl-card", (decl) => { decl.value = "var(--named-sentinel)"; });
  const next = generateCompatibility(tokens, source.toString());
  assert.deepEqual(declarations(next), declarations(`${tokens}\n${source}`));
  assert.throws(() => checkCompatibility(next, generated), /Stale/);
});

test("root default has zero specificity; existing explicit selectors remain", () => {
  const rules = postcss.parse(generated);
  const selectors = [];
  rules.walkRules((rule) => selectors.push(...rule.selectors));
  assert.ok(selectors.includes(":where(:root)"));
  assert.ok(!selectors.includes(":root"));
  for (const selector of [".dark", ".light", '[data-theme="dark"]', '[data-theme="light"]', '.dark[data-theme="intelligence"]']) {
    assert.ok(selectors.includes(selector), selector);
  }
  assert.throws(() => generateCompatibility(".dark { --x: red; }", ""), /root\/light/);
});

test("Tailwind font/radius registrations retain the canonical public defaults", () => {
  const theme = readFileSync(new URL("theme.css", styles), "utf8");
  const defaults = new Map();
  const first = postcss.parse(tokens).nodes.find((node) => node.type === "rule");
  first.walkDecls((decl) => defaults.set(decl.prop, decl.value));
  postcss.parse(theme).walkDecls((decl) => {
    if (/^--(?:font-(?:sans|display|mono)|radius-)/.test(decl.prop)) {
      assert.equal(decl.value, defaults.get(decl.prop), decl.prop);
    }
  });
  const inline = postcss.parse(theme).nodes.find((node) => node.type === "atrule" && node.params === "inline");
  assert.ok(inline);
  assert.ok(inline.nodes.some((node) => node.prop === "--color-card" && node.value === "hsl(var(--card))"));
  const bridge = postcss.parse(named).nodes.find((node) => node.type === "rule");
  const aliases = new Map(bridge.nodes.filter((node) => node.type === "decl").map((node) => [node.prop, node.value]));
  for (const decl of inline.nodes.filter((node) => node.type === "decl")) {
    assert.equal(aliases.get(decl.prop), decl.value, `${decl.prop} precompiled bridge`);
  }
});

test("compatibility has an explicit package export and a build freshness gate", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.exports["./styles/legacy-light.css"], "./src/styles/legacy-light.css");
  assert.match(pkg.scripts.build, /gen-compat\.mjs --check/);
  assert.ok(pkg.exports["./styles/ladders.css"]);
  assert.ok(pkg.exports["./styles/system.css"]);
});
