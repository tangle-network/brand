import type { OpenUIComponentNode } from "./openui-artifact-renderer";
import type { ValidateFunction } from "ajv";
import { OPENUI_NODE_TYPES } from "./schema-data";
import * as validators from "./schema-compiled";

export { OPENUI_NODE_JSON_SCHEMA, OPENUI_NODE_TYPES } from "./schema-data";
export type { OpenUIComponentNode } from "./openui-artifact-renderer";

export interface OpenUISchemaIssue {
  path: string;
  message: string;
}

type OpenUISchemaCheck =
  | { ok: true }
  | { ok: false; issue: OpenUISchemaIssue };

export type OpenUISchemaValidation<T> =
  | { ok: true; value: T }
  | { ok: false; issue: OpenUISchemaIssue };

const nodeTypes: ReadonlySet<string> = new Set(OPENUI_NODE_TYPES);

/** Find an unsupported node at any depth before the renderer can omit it. */
export function findUnsupportedOpenUINode(value: unknown): OpenUISchemaIssue | null {
  const seen = new WeakSet<object>();
  let count = 0;

  function visit(candidate: unknown, path: string, depth: number): OpenUISchemaIssue | null {
    if (depth > 32 || ++count > 1000) {
      return { path, message: "OpenUI exceeds the 32-level or 1000-node limit." };
    }
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return { path, message: "Expected an OpenUI node object." };
    }
    if (seen.has(candidate)) return { path, message: "OpenUI nodes must not contain cycles." };
    seen.add(candidate);
    const record = candidate as Record<string, unknown>;
    if (typeof record.type !== "string" || !nodeTypes.has(record.type)) {
      return { path, message: `Unsupported OpenUI node type: ${String(record.type)}.` };
    }
    if (record.type === "stack" || record.type === "grid" || record.type === "card") {
      // The model-facing schema cannot express this minimum without a required
      // recursive loop (see schema-data.ts), so the gate enforces it here.
      if (Array.isArray(record.children) && record.children.length === 0) {
        return { path: `${path}.children`, message: "OpenUI containers need at least one child." };
      }
      if (Array.isArray(record.children)) {
        for (const [index, child] of record.children.entries()) {
          const issue = visit(child, `${path}.children[${index}]`, depth + 1);
          if (issue) return issue;
        }
      }
    }
    if (record.type === "card" && record.badge !== undefined) {
      return visit(record.badge, `${path}.badge`, depth + 1);
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const [index, candidate] of value.entries()) {
      const issue = visit(candidate, `$[${index}]`, 0);
      if (issue) return issue;
    }
    return null;
  }
  return visit(value, "$", 0);
}

/** Validate one model-authored JSON node before a product persists or spends on it. */
export function validateOpenUIJsonNode(value: unknown): OpenUISchemaValidation<OpenUIComponentNode> {
  if (Array.isArray(value)) {
    return { ok: false, issue: { path: "$", message: "Expected one OpenUI node object; use validateOpenUIJsonArtifact for arrays." } };
  }
  const unsupported = findUnsupportedOpenUINode(value);
  if (unsupported) return { ok: false, issue: unsupported };
  const result = validateNode(value as Record<string, unknown>, "$", 0);
  return result.ok ? { ok: true, value: value as OpenUIComponentNode } : result;
}

/** Validate the renderer's single-node or nonempty node-array artifact shape. */
export function validateOpenUIJsonArtifact(value: unknown): OpenUISchemaValidation<OpenUIComponentNode | OpenUIComponentNode[]> {
  if (!Array.isArray(value)) return validateOpenUIJsonNode(value);
  if (value.length === 0) {
    return { ok: false, issue: { path: "$", message: "An OpenUI artifact needs at least one node." } };
  }
  const unsupported = findUnsupportedOpenUINode(value);
  if (unsupported) return { ok: false, issue: unsupported };
  for (const [index, node] of value.entries()) {
    const result = validateOpenUIJsonNode(node);
    if (!result.ok) {
      return {
        ok: false,
        issue: { ...result.issue, path: `$[${index}]${result.issue.path.slice(1)}` },
      };
    }
  }
  return { ok: true, value: value as OpenUIComponentNode[] };
}

function validateNode(record: Record<string, unknown>, path: string, depth: number): OpenUISchemaCheck {
  if (depth > 32) return { ok: false, issue: { path, message: "OpenUI exceeds the 32-level limit." } };
  if (record.type === "stack" || record.type === "grid" || record.type === "card") {
    if (Array.isArray(record.children)) {
      for (const [index, child] of record.children.entries()) {
        const result = validateNode(child as Record<string, unknown>, `${path}.children[${index}]`, depth + 1);
        if (!result.ok) return result;
      }
    }
  }
  if (record.type === "card" && record.badge && typeof record.badge === "object") {
    const result = validateNode(record.badge as Record<string, unknown>, `${path}.badge`, depth + 1);
    if (!result.ok) return result;
  }

  const validator = validators[record.type as (typeof OPENUI_NODE_TYPES)[number]] as ValidateFunction;
  if (!validator(record)) {
    const error = validator.errors?.[0];
    const field = error?.keyword === "required"
      ? String(error.params.missingProperty)
      : error?.keyword === "additionalProperties"
        ? String(error.params.additionalProperty)
        : null;
    const suffix = `${error?.instancePath ?? ""}${field ? `/${field}` : ""}`
      .replaceAll(/\/(\d+)/g, "[$1]")
      .replaceAll("/", ".");
    return { ok: false, issue: { path: `${path}${suffix}`, message: error?.message ?? "Invalid OpenUI node." } };
  }
  if (record.type === "table") {
    const columns = new Set((record.columns as Array<{ key: string }>).map((column) => column.key));
    for (const [index, row] of (record.rows as Array<Record<string, unknown>>).entries()) {
      for (const key of Object.keys(row)) {
        if (!columns.has(key)) {
          return { ok: false, issue: { path: `${path}.rows[${index}].${key}`, message: `Table cell ${key} has no displayed column.` } };
        }
      }
    }
  }
  return { ok: true };
}
