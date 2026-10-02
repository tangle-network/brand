import assert from "node:assert/strict";
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
