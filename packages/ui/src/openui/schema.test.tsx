import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpenUIArtifactRenderer } from "./openui-artifact-renderer";
import { OPENUI_NODE_JSON_SCHEMA, OPENUI_NODE_TYPES, validateOpenUIJsonArtifact, validateOpenUIJsonNode } from "./schema";

const validPage = {
  type: "card",
  title: "Release proof",
  badge: { type: "badge", label: "Ready", tone: "success" },
  children: [
    { type: "heading", text: "Result", level: 2 },
    { type: "text", text: "Three checks passed." },
    { type: "stack", children: [
      { type: "stat", label: "Checks", value: "3" },
      { type: "key_value", items: [{ label: "Allowed", value: true }, { label: "Missing", value: null }] },
      { type: "code", code: "ok", language: "text" },
      { type: "markdown", content: "**Done**" },
      { type: "table", columns: [{ key: "name", header: "Name" }], rows: [{ name: "one" }] },
      { type: "actions", actions: [{ id: "open", label: "Open" }] },
      { type: "separator" },
      { type: "grid", children: [{ type: "badge", label: "Nested" }] },
    ] },
  ],
};

describe("OpenUI JSON contract", () => {
  it("advertises every renderer node and accepts nested JSON with primitive cells", () => {
    expect(OPENUI_NODE_TYPES).toHaveLength(13);
    expect(OPENUI_NODE_JSON_SCHEMA.$defs.node.oneOf).toHaveLength(13);
    expect(validateOpenUIJsonNode(validPage)).toMatchObject({ ok: true, value: validPage });
    expect(validateOpenUIJsonArtifact([validPage, { type: "text", text: "Afterword" }])).toMatchObject({ ok: true });
  });

  it("rejects an unsupported top-level or nested section before it can be dropped", () => {
    expect(validateOpenUIJsonNode({ type: "section", children: [{ type: "text", text: "hidden" }] }))
      .toMatchObject({ ok: false, issue: { path: "$", message: expect.stringContaining("section") } });
    const nested = { type: "card", children: [{ type: "section", children: [{ type: "text", text: "hidden" }] }] };
    expect(validateOpenUIJsonNode(nested))
      .toMatchObject({ ok: false, issue: { path: "$.children[0]", message: expect.stringContaining("section") } });
    expect(validateOpenUIJsonArtifact([{ type: "text", text: "visible" }, nested]))
      .toMatchObject({ ok: false, issue: { path: "$[1].children[0]" } });
  });

  it("rejects fields the renderer would ignore and table cells with no column", () => {
    expect(validateOpenUIJsonNode({ type: "text", text: "hello", body: "hidden" }).ok).toBe(false);
    expect(validateOpenUIJsonNode({ type: "stack", children: [] }).ok).toBe(false);
    expect(validateOpenUIJsonNode({ type: "key_value", items: [{ label: "Broken", value: { nested: true } }] }).ok).toBe(false);
    expect(validateOpenUIJsonNode({ type: "table", columns: [{ key: "shown", header: "Shown" }], rows: [{ hidden: "lost" }] }))
      .toMatchObject({ ok: false, issue: { path: "$.rows[0].hidden" } });
  });

  it("shows an explicit error for an old unsupported artifact", () => {
    const oldArtifact = { type: "card", children: [{ type: "section", children: [{ type: "text", text: "hidden" }] }] };
    render(<OpenUIArtifactRenderer schema={oldArtifact as never} />);
    expect(screen.getByRole("alert").textContent).toContain("$.children[0]");
    expect(screen.getByRole("alert").textContent).toContain("section");
  });
});
