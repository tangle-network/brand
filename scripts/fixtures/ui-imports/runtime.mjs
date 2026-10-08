import assert from "node:assert/strict";
import { Input, Textarea, Button, Select, SelectTrigger, SelectValue, Metric, MetricStrip } from "@tangle-network/ui/primitives";
import { createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { Fixture as Primitives } from "./primitives.mjs";
import { Fixture as RootPrimitives } from "./root.mjs";
import { Fixture as Markdown, compatibility } from "./markdown.mjs";
import { Fixture as Editor } from "./editor.mjs";

async function until(predicate, message) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`${message}: ${document.body.textContent}`);
}

export async function verify() {
  assert.ok(compatibility, "legacy CodeBlock and CopyButton must retain identity");
  for (const Component of [Primitives, RootPrimitives]) {
    const html = renderToStaticMarkup(h(Component));
    assert.match(html, /Packed button/);
    assert.match(html, /aria-label="Packed input"/);
    assert.match(html, /value="Packed value"/);
  }
  // Exercise the additive presentation API through installed packed exports.
  // Do not change the four browser-graph fixtures or their byte comparisons.
  for (const size of ["compact", "touch"]) {
    const html = renderToStaticMarkup(h("section", null,
      h(Input, { size, "aria-label": "Packed sized input" }),
      h(Textarea, { size, "aria-label": "Packed sized textarea" }),
      h(Button, { size, loading: true }, "Save changes"),
      h(Select, null, h(SelectTrigger, { size, "aria-label": "Packed select" }, h(SelectValue, { placeholder: "Choose" }))),
    ));
    assert.ok(html.includes("bg-[var(--field-surface,var(--bg-input))]"), "fields use the scoped field well");
    assert.ok(html.includes("duration-[var(--duration-fast)]"), "duration token is time-valued");
    assert.ok(!html.includes("duration-[var(--transition-fast)]"));
    assert.ok(!html.includes(`size="${size}"`), "presentation size must not leak to native attributes");
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /Save changes/);
  }
  for (const columns of [3, 4, 5, 6]) {
    const html = renderToStaticMarkup(h(MetricStrip, { columns },
      Array.from({ length: columns }, (_, index) => h(Metric, {
        key: index, label: `Packed metric ${index}`, value: index === 0 ? "—" : 0, hint: 0,
      })),
    ));
    const parsed = document.createElement("div");
    parsed.innerHTML = html;
    assert.equal(parsed.querySelectorAll("dl > div > dt").length, columns);
    assert.equal(parsed.querySelectorAll("dl > div > dd").length, columns * 2);
    assert.equal(parsed.querySelector("dd").textContent, "—");
    assert.equal(parsed.querySelectorAll("dd")[1].textContent, "0");
    assert.equal(parsed.querySelector("dl").hasAttribute("columns"), false);
  }
  const markdown = renderToStaticMarkup(h(Markdown));
  assert.match(markdown, /<h1[^>]*>Packed markdown<\/h1>/);
  assert.match(markdown, /packedAnswer/);
  assert.match(markdown, /<pre\b[^>]*><code\b[^>]*>const packedAnswer = 42;/);

  const root = createRoot(document.getElementById("root"));
  try {
    root.render(h(Markdown));
    await until(() => document.querySelector("pre code")?.innerHTML.includes("--syntax-number") &&
      document.querySelector("pre code")?.textContent.includes("packedAnswer"),
    "the packed async highlighter must load for fenced code");
    root.render(h(Editor));
    await until(() => document.querySelector('.ProseMirror[contenteditable="true"]')?.textContent.includes("Packed editor"),
      "the installed editor peers must load and mount the local editor");
    root.render(h(Editor, { markdown: "# Updated packed editor", readOnly: true }));
    await until(() => document.querySelector('.ProseMirror[contenteditable="false"]')?.textContent.includes("Updated packed editor"),
      "the packed editor must accept content and read-only updates");
    console.log("UI_IMPORTS_RUNTIME: primitives SSR, readable markdown SSR, async highlighting, legacy identity, local editor mount/update passed");
  } finally {
    root.unmount();
  }
}
