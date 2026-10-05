import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getSanitizedMarkdownHeadingIdFromRawFragment } from "../markdown/markdown";
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

type JsonSchema = Record<string, unknown>;

/**
 * Model tool-schema converters accept a recursive `$ref` only when the loop can
 * terminate: it must pass through an optional property or an array that may be
 * empty. Return the first `$defs` path that recurses through required,
 * nonempty values only.
 */
function findRequiredRefLoop(defs: Record<string, JsonSchema>): string | null {
  function visit(schema: JsonSchema, path: string, stack: string[]): string | null {
    const ref = typeof schema.$ref === "string" ? schema.$ref.replace("#/$defs/", "") : null;
    if (ref) {
      if (stack.includes(ref)) return path;
      return visit(defs[ref]!, `$defs.${ref}`, [...stack, ref]);
    }
    for (const key of ["oneOf", "anyOf"] as const) {
      const options = schema[key];
      if (Array.isArray(options)) {
        for (const [index, option] of options.entries()) {
          const loop = visit(option as JsonSchema, `${path}.${key}.${index}`, stack);
          if (loop) return loop;
        }
      }
    }
    if (schema.type === "array" && schema.items && Number(schema.minItems ?? 0) > 0) {
      return visit(schema.items as JsonSchema, `${path}.items`, stack);
    }
    const required = Array.isArray(schema.required) ? schema.required as string[] : [];
    const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
    for (const name of required) {
      if (!properties[name]) continue;
      const loop = visit(properties[name], `${path}.properties.${name}`, stack);
      if (loop) return loop;
    }
    return null;
  }
  return visit({ $ref: "#/$defs/node" }, "$", []);
}

describe("OpenUI JSON contract", () => {
  it("advertises every renderer node and accepts nested JSON with primitive cells", () => {
    expect(OPENUI_NODE_TYPES).toHaveLength(13);
    expect(OPENUI_NODE_JSON_SCHEMA.$defs.node.oneOf).toHaveLength(13);
    expect(validateOpenUIJsonNode(validPage)).toMatchObject({ ok: true, value: validPage });
    expect(validateOpenUIJsonArtifact([validPage, { type: "text", text: "Afterword" }])).toMatchObject({ ok: true });
  });

  it("keeps every recursive node path terminable for model tool-schema converters", () => {
    expect(findRequiredRefLoop(OPENUI_NODE_JSON_SCHEMA.$defs as unknown as Record<string, JsonSchema>)).toBeNull();
    expect(validateOpenUIJsonNode({ type: "card", title: "Empty", children: [] }))
      .toMatchObject({ ok: false, issue: { path: "$.children" } });
  });

  it("rejects an unsupported top-level or nested section before it can be dropped", () => {
    expect(validateOpenUIJsonNode({ type: "section", children: [{ type: "text", text: "hidden" }] }))
      .toMatchObject({ ok: false, issue: { path: "$", message: expect.stringContaining("section") } });
    const nested = { type: "card", children: [{ type: "section", children: [{ type: "text", text: "hidden" }] }] };
    expect(validateOpenUIJsonNode(nested))
      .toMatchObject({ ok: false, issue: { path: "$.children[0]", message: expect.stringContaining("section") } });
    expect(validateOpenUIJsonArtifact([{ type: "text", text: "visible" }, nested]))
      .toMatchObject({ ok: false, issue: { path: "$[1].children[0]" } });
    expect(validateOpenUIJsonArtifact(Array.from({ length: 1001 }, () => ({ type: "text", text: "too many" }))))
      .toMatchObject({ ok: false, issue: { path: "$[1000]" } });
  });

  it("rejects fields the renderer would ignore and table cells with no column", () => {
    expect(validateOpenUIJsonNode({ type: "text", text: "hello", body: "hidden" }).ok).toBe(false);
    expect(validateOpenUIJsonNode({ type: "stack", children: [] }).ok).toBe(false);
    expect(validateOpenUIJsonNode({ type: "key_value", items: [{ label: "Broken", value: { nested: true } }] }).ok).toBe(false);
    expect(validateOpenUIJsonNode({ type: "table", columns: [{ key: "shown", header: "Shown" }], rows: [{ hidden: "lost" }] }))
      .toMatchObject({ ok: false, issue: { path: "$.rows[0].hidden" } });
  });

  it("rejects arrays passed as a single node while keeping optional card fields", () => {
    expect(validateOpenUIJsonNode([{ type: "text", text: "ok" }]))
      .toMatchObject({ ok: false, issue: { path: "$" } });
    expect(validateOpenUIJsonNode({ type: "card" }).ok).toBe(true);
    expect(validateOpenUIJsonNode({ type: "card", title: "A result" }).ok).toBe(true);
  });

  it("renders an absent prototype-named table cell safely", () => {
    const table = JSON.parse('{"type":"table","columns":[{"key":"__proto__","header":"Value"}],"rows":[{}]}');
    expect(validateOpenUIJsonNode(table).ok).toBe(true);
    render(<OpenUIArtifactRenderer schema={table} />);
    expect(screen.getByText("Value")).toBeTruthy();
  });

  it("forwards URL transforms and keeps cross-file fragments aligned with sanitized headings", () => {
    const urlTransform = vi.fn((url: string, key: string) => {
      if (key !== "href") return url;
      const separator = url.indexOf("#");
      const fragment = separator >= 0
        ? "#" + getSanitizedMarkdownHeadingIdFromRawFragment(url.slice(separator + 1))
        : "";
      return "/app/ws-1/vault?file=campaigns%2Fpacket.md" + fragment;
    });

    render(
      <OpenUIArtifactRenderer
        schema={{
          type: "card",
          children: [{
            type: "markdown",
            content: "[Packet](campaigns/packet.md#Cr%C3%A8me%20br%C3%BBl%C3%A9e)\n\n# Crème brûlée",
          }],
        }}
        urlTransform={urlTransform}
      />,
    );

    expect(screen.getByRole("link", { name: "Packet" })).toHaveAttribute(
      "href",
      "/app/ws-1/vault?file=campaigns%2Fpacket.md#user-content-crème-brûlée",
    );
    expect(screen.getByRole("heading", { name: "Crème brûlée" })).toHaveAttribute(
      "id",
      "user-content-crème-brûlée",
    );
    expect(urlTransform).toHaveBeenCalledWith(
      "campaigns/packet.md#Cr%C3%A8me%20br%C3%BBl%C3%A9e",
      "href",
      expect.objectContaining({ tagName: "a" }),
    );
  });

  it("shows an explicit error for an old unsupported artifact", () => {
    const oldArtifact = { type: "card", children: [{ type: "section", children: [{ type: "text", text: "hidden" }] }] };
    render(<OpenUIArtifactRenderer schema={oldArtifact as never} />);
    expect(screen.getByRole("alert").textContent).toContain("$.children[0]");
    expect(screen.getByRole("alert").textContent).toContain("section");
  });
});
