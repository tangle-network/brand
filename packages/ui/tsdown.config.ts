import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    primitives: "src/primitives/index.ts",
    chat: "src/chat/index.ts",
    run: "src/run/index.ts",
    openui: "src/openui/index.ts",
    "openui-schema": "src/openui/schema.ts",
    files: "src/files/index.ts",
    editor: "src/editor/index.ts",
    markdown: "src/markdown/index.ts",
    auth: "src/auth/index.ts",
    hooks: "src/hooks/index.ts",
    nav: "src/nav/index.tsx",
    "sdk-hooks": "src/sdk-hooks.ts",
    stores: "src/stores/index.ts",
    types: "src/types/index.ts",
    utils: "src/utils/index.ts",
    "tool-previews": "src/tool-previews/index.ts",
    redaction: "src/redaction/index.ts",
  },
  // Keep component modules independently removable by consumers. In particular,
  // the existing primitives -> markdown CodeBlock re-export must not co-locate
  // syntax-highlighter initialization with Button/Input/Card in a shared chunk.
  // Explicit entry names above retain every existing package export target.
  unbundle: true,
  root: "src",
  format: ["esm"],
  platform: "neutral",
  dts: true,
  clean: true,
  fixedExtension: false,
  // Consumers continue to own their client boundaries.
  checks: { moduleLevelDirective: false },
});
