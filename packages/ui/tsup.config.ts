import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    primitives: "src/primitives/index.ts",
    chat: "src/chat/index.ts",
    run: "src/run/index.ts",
    openui: "src/openui/index.ts",
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
  },
  format: ["esm"],
  dts: true,
  splitting: true,
  clean: true,
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
