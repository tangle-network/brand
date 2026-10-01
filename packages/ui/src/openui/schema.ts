import Ajv from "ajv";
import type { OpenUIComponentNode } from "./openui-artifact-renderer";

export type { OpenUIComponentNode } from "./openui-artifact-renderer";

/** JSON nodes the maintained OpenUI renderer can display. */
export const OPENUI_NODE_TYPES = [
  "heading", "text", "badge", "stat", "key_value", "code", "markdown",
  "table", "actions", "separator", "stack", "grid", "card",
] as const;

const string = { type: "string" } as const;
const boolean = { type: "boolean" } as const;
const gap = { enum: ["sm", "md", "lg"] } as const;
const primitive = { type: ["string", "number", "boolean", "null"] } as const;
const children = { type: "array", minItems: 1, items: { $ref: "#/$defs/node" } } as const;
const actions = { type: "array", minItems: 1, items: { $ref: "#/$defs/action" } } as const;

function node(type: string, fields: Record<string, unknown>, required: string[] = []) {
  return {
    type: "object",
    required: ["type", ...required],
    properties: { type: { const: type }, id: string, ...fields },
    additionalProperties: false,
  };
}

/**
 * The model-facing shape and the persistence gate share this exact schema.
 * It covers JSON authored by an agent, not the renderer's programmatic ReactNode
 * cells or onPress callbacks.
 */
export const OPENUI_NODE_JSON_SCHEMA = {
  type: "object",
  $ref: "#/$defs/node",
  $defs: {
    node: { oneOf: OPENUI_NODE_TYPES.map((type) => ({ $ref: `#/$defs/${type}` })) },
    action: {
      type: "object",
      required: ["id", "label"],
      properties: {
        id: string,
        label: string,
        tone: { enum: ["default", "secondary", "outline", "ghost", "destructive"] },
        disabled: boolean,
      },
      additionalProperties: false,
    },
    heading: node("heading", {
      text: string, level: { enum: [1, 2, 3, 4] }, kicker: string, meta: string,
    }, ["text"]),
    text: node("text", {
      text: string, tone: { enum: ["default", "muted", "success", "warning", "error"] }, mono: boolean,
    }, ["text"]),
    badge: node("badge", {
      label: string, tone: { enum: ["default", "secondary", "success", "warning", "error", "info", "sandbox"] },
    }, ["label"]),
    stat: node("stat", {
      label: string, value: string, change: string,
      tone: { enum: ["default", "success", "warning", "error", "info"] },
    }, ["label", "value"]),
    key_value: node("key_value", {
      items: {
        type: "array", minItems: 1,
        items: {
          type: "object", required: ["label", "value"],
          properties: { id: string, label: string, value: primitive, tone: { enum: ["default", "muted"] } },
          additionalProperties: false,
        },
      },
    }, ["items"]),
    code: node("code", {
      code: string, language: string, title: string, showLineNumbers: boolean,
    }, ["code"]),
    markdown: node("markdown", { content: string }, ["content"]),
    table: node("table", {
      columns: {
        type: "array", minItems: 1,
        items: {
          type: "object", required: ["key", "header"],
          properties: { key: string, header: string, align: { enum: ["left", "right"] } },
          additionalProperties: false,
        },
      },
      rows: { type: "array", items: { type: "object", additionalProperties: primitive } },
      caption: string,
    }, ["columns", "rows"]),
    actions: node("actions", { actions }, ["actions"]),
    separator: node("separator", { label: string }),
    stack: node("stack", {
      direction: { enum: ["row", "column"] }, gap,
      align: { enum: ["start", "center", "end", "stretch"] }, wrap: boolean, children,
    }, ["children"]),
    grid: node("grid", { columns: { enum: [1, 2, 3, 4] }, gap, children }, ["children"]),
    card: node("card", {
      title: string, description: string, eyebrow: string,
      badge: { $ref: "#/$defs/badge" }, actions, children,
    }),
  },
} as const;

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
const ajv = new Ajv({ allErrors: false, allowUnionTypes: true });
const validators = Object.fromEntries(OPENUI_NODE_TYPES.map((type) => [
  type,
  ajv.compile({ $ref: `#/$defs/${type}`, $defs: OPENUI_NODE_JSON_SCHEMA.$defs }),
])) as Record<(typeof OPENUI_NODE_TYPES)[number], ReturnType<Ajv["compile"]>>;

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

  const validator = validators[record.type as (typeof OPENUI_NODE_TYPES)[number]];
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
