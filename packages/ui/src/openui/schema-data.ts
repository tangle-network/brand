export const OPENUI_NODE_TYPES = [
  "heading", "text", "badge", "stat", "key_value", "code", "markdown",
  "table", "actions", "separator", "stack", "grid", "card",
] as const;

const string = { type: "string" } as const;
const boolean = { type: "boolean" } as const;
const gap = { enum: ["sm", "md", "lg"] } as const;
const primitive = { type: ["string", "number", "boolean", "null"] } as const;
// No minItems here: stack and grid require `children` and a child can itself be
// a stack, so a nonempty minimum makes a required recursive loop that model
// tool-schema converters reject (opencode refused render_ui outright). The
// persistence gate in schema.ts still rejects an empty container.
const children = { type: "array", items: { $ref: "#/$defs/node" } } as const;
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

