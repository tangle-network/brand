interface MdastNode {
  type: string;
  lang?: string | null;
  meta?: string | null;
  data?: { hProperties?: Record<string, unknown> } & Record<string, unknown>;
  children?: MdastNode[];
}

/**
 * Carries a fence's info string past the language (```ts title="src/x.ts"```)
 * to the rendered `<code>` as `data-meta`, so the code block can name its file.
 */
export function remarkCodeMeta() {
  return (tree: MdastNode) => {
    const walk = (node: MdastNode) => {
      if (node.type === "code" && node.meta) {
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, dataMeta: node.meta } };
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "typescript", mts: "typescript", cts: "typescript", tsx: "tsx",
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "jsx",
  json: "json", jsonc: "jsonc", md: "markdown", mdx: "mdx", py: "python",
  sh: "bash", bash: "bash", zsh: "bash", yml: "yaml", yaml: "yaml", toml: "toml",
  css: "css", scss: "scss", html: "html", sql: "sql", go: "go", rs: "rust",
  sol: "solidity", rb: "ruby", java: "java", kt: "kotlin", swift: "swift",
  php: "php", c: "c", h: "c", cpp: "cpp", cs: "csharp", graphql: "graphql",
  gql: "graphql", xml: "xml", svg: "xml", diff: "diff", patch: "diff",
};

const FILE_PATH = /^(?:\.{0,2}\/)?(?:[\w@.-]+\/)*[\w@.-]*\.[A-Za-z0-9]+$|^(?:[\w@.-]+\/)+[\w@.-]+$/;

/** The language a file's extension implies, if the code block can highlight it. */
export function languageForFile(filename: string): string | undefined {
  const base = filename.split("/").pop() ?? filename;
  if (/^dockerfile$/i.test(base)) return "dockerfile";
  const extension = base.includes(".") ? base.split(".").pop()?.toLowerCase() : undefined;
  return extension ? LANGUAGE_BY_EXTENSION[extension] : undefined;
}

/**
 * The language and file name of a fenced block, from its class and info
 * string: ```ts title="src/x.ts"```, ```ts filename=src/x.ts```,
 * ```ts src/x.ts```, ```ts:src/x.ts``` and ```src/x.ts``` all name the file.
 */
export function fenceInfo(className: string | undefined, meta: unknown): { language?: string; filename?: string } {
  const token = /(?:^|\s)language-(\S+)/.exec(className ?? "")?.[1];
  let language = token;
  let filename: string | undefined;
  if (token?.includes(":")) {
    [language, filename] = [token.slice(0, token.indexOf(":")), token.slice(token.indexOf(":") + 1)];
  } else if (token && FILE_PATH.test(token) && (token.includes("/") || languageForFile(token))) {
    filename = token;
    language = undefined;
  }
  if (!filename && typeof meta === "string") {
    const named = /(?:^|\s)(?:title|filename|file|name)=(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(meta);
    const bare = meta.trim().split(/\s+/).find((part) => FILE_PATH.test(part));
    filename = named?.[1] ?? named?.[2] ?? named?.[3] ?? bare;
  }
  if (!language && filename) language = languageForFile(filename);
  return { ...(language ? { language } : {}), ...(filename ? { filename } : {}) };
}
