import { memo } from "react";
import ReactMarkdown, { defaultUrlTransform, type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import { CodeBlock, CopyButton } from "./code-block";
import { cn } from "../lib/utils";

const SANITIZED_HEADING_ID_PREFIX = "user-content-";

/** Converts a raw Markdown fragment to the ID rehype-sanitize emits for its heading. */
export function getSanitizedMarkdownHeadingIdFromRawFragment(rawFragment: string): string {
  let decodedFragment = rawFragment;
  try {
    decodedFragment = decodeURIComponent(rawFragment);
  } catch {
    // Keep malformed percent escapes literal, as browsers do for fragment targets.
  }
  const slugger = new GithubSlugger();
  return SANITIZED_HEADING_ID_PREFIX + slugger.slug(decodedFragment);
}

function safeUrl(url: string): string | undefined {
  return defaultUrlTransform(url) ?? undefined;
}

function transformMarkdownUrl(
  url: string,
  key: string,
  node: Parameters<UrlTransform>[2],
  urlTransform?: UrlTransform,
) {
  const transformed = urlTransform ? urlTransform(url, key, node) : url;
  if (transformed == null) return undefined;

  if (key === "href" && transformed === url && url.startsWith("#")) {
    return safeUrl("#" + getSanitizedMarkdownHeadingIdFromRawFragment(url.slice(1)));
  }

  return safeUrl(transformed);
}

export interface MarkdownProps {
  children: string;
  className?: string;
  /** Transform parsed link and image URLs while retaining protocol safety checks. */
  urlTransform?: UrlTransform;
}

/**
 * Renders Markdown content with GFM support, XSS sanitisation, and
 * custom code block rendering via our CodeBlock component.
 */
export const Markdown = memo(({ children, className, urlTransform }: MarkdownProps) => {
  return (
    <div
      className={cn("tangle-prose max-w-none text-sm", className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeSanitize]}
        urlTransform={(url, key, node) => transformMarkdownUrl(url, key, node, urlTransform)}
        components={{
          pre({ children: preChildren }) {
            return <>{preChildren}</>;
          },
          code({ className: codeClass, children: codeChildren, ...rest }) {
            const match = /language-(\w+)/.exec(codeClass || "");
            const language = match?.[1];
            const code = String(codeChildren).replace(/\n$/, "");

            // Inline code (no language fence)
            if (!language && !code.includes("\n")) {
              return (
                <code
                  className={cn(
                    "px-1.5 py-0.5 rounded border border-border bg-card text-[var(--code-keyword)] text-[0.85em] font-mono",
                    codeClass,
                  )}
                  {...rest}
                >
                  {codeChildren}
                </code>
              );
            }

            return (
              <CodeBlock code={code} language={language}>
                <CopyButton text={code} />
              </CodeBlock>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
Markdown.displayName = "Markdown";
