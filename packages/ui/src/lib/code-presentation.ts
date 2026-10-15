import { tabsPresentation } from "../presentation";
import type { HighlighterCore, LanguageRegistration, ThemedToken } from "shiki/core";
// Leave variables unresolved: the browser resolves them on each token span,
// including nested themes, inline overrides and CSS/media changes. No document
// sampling, observers, layout reads or React re-render are needed to recolor code.
export const SYNTAX = {
  comment: "var(--syntax-comment, currentColor)",
  keyword: "var(--syntax-keyword, currentColor)",
  string: "var(--syntax-string, currentColor)",
  function: "var(--syntax-function, currentColor)",
  number: "var(--syntax-number, currentColor)",
  variable: "var(--syntax-variable, currentColor)",
  foreground: "var(--syntax-foreground, currentColor)",
} as const;

const SHIKI_THEME = "tangle-syntax";
// Shiki's CSS-variables theme names token roles; each maps onto a Brand syntax token.
const BRAND_COLOR_FOR_SHIKI: Record<string, string> = {
  "var(--shiki-foreground)": SYNTAX.foreground,
  "var(--shiki-token-comment)": SYNTAX.comment,
  "var(--shiki-token-keyword)": SYNTAX.keyword,
  "var(--shiki-token-string)": SYNTAX.string,
  "var(--shiki-token-string-expression)": SYNTAX.string,
  "var(--shiki-token-function)": SYNTAX.function,
  "var(--shiki-token-constant)": SYNTAX.number,
  "var(--shiki-token-link)": SYNTAX.number,
  "var(--shiki-token-parameter)": SYNTAX.variable,
  "var(--shiki-token-punctuation)": SYNTAX.foreground,
};

type GrammarModule = { default: LanguageRegistration[] };
const GRAMMARS: Record<string, () => Promise<GrammarModule>> = {
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsonc: () => import("shiki/langs/jsonc.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  scss: () => import("shiki/langs/scss.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  mdx: () => import("shiki/langs/mdx.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  solidity: () => import("shiki/langs/solidity.mjs"),
  ruby: () => import("shiki/langs/ruby.mjs"),
  java: () => import("shiki/langs/java.mjs"),
  kotlin: () => import("shiki/langs/kotlin.mjs"),
  swift: () => import("shiki/langs/swift.mjs"),
  php: () => import("shiki/langs/php.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  csharp: () => import("shiki/langs/csharp.mjs"),
  graphql: () => import("shiki/langs/graphql.mjs"),
  xml: () => import("shiki/langs/xml.mjs"),
  dockerfile: () => import("shiki/langs/dockerfile.mjs"),
};

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript", mts: "typescript", cts: "typescript", js: "javascript", mjs: "javascript",
  cjs: "javascript", node: "javascript", sh: "bash", shell: "bash", zsh: "bash", console: "bash",
  shellscript: "bash", py: "python", python3: "python", yml: "yaml", md: "markdown", rs: "rust",
  sol: "solidity", rb: "ruby", kt: "kotlin", cs: "csharp", "c#": "csharp", "c++": "cpp",
  gql: "graphql", svg: "xml", docker: "dockerfile", patch: "diff", htm: "html",
};

export const LANGUAGE_NAMES: Record<string, string> = {
  typescript: "TypeScript", tsx: "TSX", javascript: "JavaScript", jsx: "JSX", json: "JSON",
  jsonc: "JSONC", bash: "Bash", python: "Python", html: "HTML", css: "CSS", scss: "SCSS",
  markdown: "Markdown", mdx: "MDX", yaml: "YAML", toml: "TOML", sql: "SQL", diff: "Diff",
  go: "Go", rust: "Rust", solidity: "Solidity", ruby: "Ruby", java: "Java", kotlin: "Kotlin",
  swift: "Swift", php: "PHP", c: "C", cpp: "C++", csharp: "C#", graphql: "GraphQL", xml: "XML",
  dockerfile: "Dockerfile",
};

/** The Shiki grammar for a fence language, or undefined for plain text. */
export const PLAIN_TEXT = new Set(["text", "txt", "plain", "plaintext"]);

export function codeBlockGrammar(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const id = language.toLowerCase();
  const resolved = LANGUAGE_ALIASES[id] ?? id;
  return GRAMMARS[resolved] ? resolved : undefined;
}

let highlighterPromise: Promise<HighlighterCore> | undefined;
const grammarLoads = new Map<string, Promise<void>>();

function loadHighlighter(): Promise<HighlighterCore> {
  // The JavaScript regex engine needs no WebAssembly, so it runs under a strict CSP.
  return highlighterPromise ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript")])
    .then(([core, engine]) => core.createHighlighterCore({
      themes: [core.createCssVariablesTheme({ name: SHIKI_THEME, variablePrefix: "--shiki-", fontStyle: true })],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    }))
    .catch((error: unknown) => {
      highlighterPromise = undefined;
      throw error;
    });
}

export async function tokenize(code: string, grammar: string): Promise<ThemedToken[][]> {
  const highlighter = await loadHighlighter();
  let load = grammarLoads.get(grammar);
  if (!load) {
    load = GRAMMARS[grammar]!().then((module) => highlighter.loadLanguage(module.default));
    load.catch(() => grammarLoads.delete(grammar));
    grammarLoads.set(grammar, load);
  }
  await load;
  return highlighter.codeToTokensBase(code, { lang: grammar, theme: SHIKI_THEME });
}

export function tokenStyle(token: ThemedToken): TokenStyle | undefined {
  const color = token.color ? BRAND_COLOR_FOR_SHIKI[token.color] ?? SYNTAX.foreground : undefined;
  const style = token.fontStyle ?? 0;
  if (!color && !style) return undefined;
  return {
    ...(color ? { color } : {}),
    ...(style & 1 ? { fontStyle: "italic" } : {}),
    ...(style & 2 ? { fontWeight: "bold" } : {}),
    ...(style & 4 ? { textDecoration: "underline" } : {}),
  };
}

export interface TokenStyle {color?: string; fontStyle?: "italic"; fontWeight?: "bold"; textDecoration?: "underline";}
export const codePreStyle = {
  margin: 0, padding: "var(--code-padding-y, 0.625rem) var(--code-padding-x, 0.75rem)",
  background: "transparent", color: SYNTAX.foreground, fontSize: "var(--code-font-size, 0.8125rem)",
  lineHeight: "var(--code-line-height, 1.5)", overflowX: "auto",
} as const;
export const codeTextStyle = {fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)",whiteSpace:"pre"} as const;
export const codePresentation = {
  tabs: `tangle-code-tabs ${tabsPresentation.list.underline}`,
  tab: tabsPresentation.trigger.underline,
  root: "group relative min-w-0 overflow-hidden rounded-lg border font-mono bg-card border-border",
  header: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-1.5 bg-[var(--code-header-bg,hsl(var(--background)))]",
  copy: "flex items-center justify-center min-w-8 min-h-8 pointer-coarse:min-w-11 pointer-coarse:min-h-11 rounded-md bg-muted border border-border hover:border-[var(--border-strong)] transition-colors",
};
export interface CodeExample {label:string;code:string;language?:string;filename?:string;}
export interface ApiMetadata {kind:"request"|"response"|"error";method?:string;status?:number;contentType?:string;}
export const apiMetadataText = (meta:ApiMetadata) => [meta.kind,meta.method,meta.status,meta.contentType].filter(v=>v!==undefined).join(" · ");

/** Same lazy grammar/token model for React, Hono SSR and static renderers. */
export async function highlightCode(code:string,language?:string) {
 const grammar=codeBlockGrammar(language);
 if(!grammar)return code.split("\n").map(content=>[{content,style:undefined as TokenStyle|undefined}]);
 return (await tokenize(code,grammar)).map(line=>line.map(token=>({content:token.content,style:tokenStyle(token)})));
}
/** Legacy fallback is used only when the modern clipboard API is absent. */
export async function writeClipboard(text:string):Promise<void> {
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
 const active=document.activeElement as HTMLElement|null,selection=document.getSelection();
 const ranges=selection?Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()):[];
 const field=document.createElement("textarea");field.value=text;field.readOnly=true;field.tabIndex=-1;
 field.setAttribute("aria-hidden","true");field.style.position="fixed";field.style.left="-9999px";
 document.body.append(field);
 try {field.select();if(!document.execCommand?.("copy"))throw Error("Clipboard unavailable");}
 finally {field.remove();active?.focus({preventScroll:true});if(selection){selection.removeAllRanges();for(const range of ranges)selection.addRange(range);}}
}
const COPY_FEEDBACK_MS=2000;
export interface CopyFeedback {copied:boolean;status:string;}
/** Owns async ordering, announcements and timer cleanup for both renderers. */
export function createCopyFeedback(change:(state:CopyFeedback)=>void,write:(text:string)=>Promise<void>=writeClipboard) {
 let attempt=0,disposed=false,timer:ReturnType<typeof setTimeout>|undefined;
 return {
  async copy(text:string) {
   const current=++attempt;if(timer)clearTimeout(timer);if(disposed)return;
   change({copied:false,status:""});
   let state:CopyFeedback;
   try {await write(text);state={copied:true,status:"Copied to clipboard"};}
   catch {state={copied:false,status:"Copy failed"};}
   if(disposed||current!==attempt)return;change(state);
   timer=setTimeout(()=>{if(!disposed)change({copied:false,status:""});},COPY_FEEDBACK_MS);
  },
  dispose(){disposed=true;attempt++;if(timer)clearTimeout(timer);},
 };
}
export function bindCopyButton(button:HTMLButtonElement,status:HTMLElement,text:()=>string) {
 const feedback=createCopyFeedback(state=>{status.textContent=state.status;button.setAttribute("aria-label",state.copied?"Copied":"Copy to clipboard");});
 const click=()=>void feedback.copy(text());button.addEventListener("click",click);
 return ()=>{button.removeEventListener("click",click);feedback.dispose();};
}
/** Native tabs adapter. The consumer owns labels, IDs and escaped panel content. */
export function bindCodeTabs(list:HTMLElement,onSelect?:(index:number)=>void) {
 const buttons=()=>[...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
 const select=(index:number,focus:boolean)=>{
  const tabs=buttons(),tab=tabs[index];if(!tab)return;
  for(const panel of new Set(tabs.map(t=>document.getElementById(t.getAttribute("aria-controls")??""))))if(panel)panel.hidden=true;
  tabs.forEach((t,i)=>{t.setAttribute("aria-selected",String(i===index));t.dataset.state=i===index?"active":"inactive";t.tabIndex=i===index?0:-1;});
  const panel=document.getElementById(tab.getAttribute("aria-controls")??"");if(panel){panel.hidden=false;panel.setAttribute("aria-labelledby",tab.id);}
  if(focus)tab.focus();onSelect?.(index);
 };
 const click=(event:MouseEvent)=>{const tab=(event.target as Element).closest('[role="tab"]');const index=buttons().findIndex(t=>t===tab);if(index>=0)select(index,false);};
 const key=(event:KeyboardEvent)=>{
  const tabs=buttons(),current=tabs.findIndex(t=>t===document.activeElement);if(current<0)return;
  const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:event.key==="ArrowRight"?(current+1)%tabs.length:event.key==="ArrowLeft"?(current+tabs.length-1)%tabs.length:undefined;
  if(next!==undefined){event.preventDefault();select(next,true);}
 };
 list.addEventListener("click",click);list.addEventListener("keydown",key);
 return ()=>{list.removeEventListener("click",click);list.removeEventListener("keydown",key);};
}
export interface ApiField {name:string;type:string;description?:string;required?:boolean;children?:readonly ApiField[];}
export function schemaRows(fields:readonly ApiField[],parent="",depth=0):Array<ApiField&{path:string;depth:number}> {
 return fields.flatMap(field=>{const path=parent?`${parent}.${field.name}`:field.name;return [{...field,path,depth},...schemaRows(field.children??[],path,depth+1)];});
}
