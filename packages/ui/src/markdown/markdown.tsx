import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import ReactMarkdown, { defaultUrlTransform, type ExtraProps, type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import { ImageOff } from "lucide-react";
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

// An image already wrapped in a Markdown link keeps that link: anchors cannot nest.
const MarkdownLinkContext = createContext(false);

function MarkdownLink({ node: _node, ...props }: ComponentProps<"a"> & ExtraProps) {
  return (
    <MarkdownLinkContext.Provider value>
      <a {...props} />
    </MarkdownLinkContext.Provider>
  );
}

/**
 * Renders a Markdown image that opens full size in a new tab, or a labelled
 * placeholder when its URL is unsafe or fails to load, instead of the
 * browser's broken-image icon.
 */
function MarkdownImage({ node: _node, src, alt, className, ...props }: ComponentProps<"img"> & ExtraProps) {
  const insideLink = useContext(MarkdownLinkContext);
  const imageRef = useRef<HTMLImageElement>(null);
  const url = typeof src === "string" && src ? src : undefined;
  const [failedUrl, setFailedUrl] = useState<string>();

  // A server-rendered image can fail before hydration attaches onError.
  useEffect(() => {
    const image = imageRef.current;
    if (!url || !image?.complete || typeof image.decode !== "function") return;
    let current = true;
    image.decode().catch(() => {
      if (current) setFailedUrl(url);
    });
    return () => {
      current = false;
    };
  }, [url]);

  if (!url || failedUrl === url) {
    const label = alt ? `Image unavailable: ${alt}` : "Image unavailable";
    return (
      <span
        role="img"
        aria-label={label}
        className="inline-flex max-w-full items-center gap-2 rounded-md border border-dashed border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
      >
        <ImageOff aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{label}</span>
      </span>
    );
  }

  const image = (
    <img
      {...props}
      ref={imageRef}
      src={url}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(url)}
      className={cn("h-auto max-w-full rounded-md", className)}
    />
  );
  if (insideLink) return image;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block max-w-full">
      {image}
    </a>
  );
}

export interface MarkdownProps {
  children: string;
  className?: string;
  /** Transform parsed link and image URLs while retaining protocol safety checks. */
  urlTransform?: UrlTransform;
}

/**
 * Renders Markdown content with GFM support, XSS sanitisation, custom code
 * block rendering via our CodeBlock component, and images that open full size
 * or show a labelled placeholder when unavailable.
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
          a: MarkdownLink,
          img: MarkdownImage,
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
                    "px-1.5 py-0.5 rounded border border-border bg-muted text-foreground text-[0.85em] font-mono",
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

