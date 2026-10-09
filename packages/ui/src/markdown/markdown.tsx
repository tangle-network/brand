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
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import GithubSlugger from "github-slugger";
import { FileImage, FileText, Folder, ImageOff, Package, type LucideIcon } from "lucide-react";
import { CodeBlock, CopyButton } from "./code-block";
import { fenceInfo, remarkCodeMeta } from "./code-meta";
import {
  MarkdownTable,
  MarkdownTableBody,
  MarkdownTableCell,
  MarkdownTableHead,
  MarkdownTableHeaderCell,
  MarkdownTableRow,
} from "./markdown-table";
import { focusRing } from "../lib/focus";
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

/** How a link to a known object renders: a chip with that object's icon. */
export interface MarkdownLinkChip {
  kind: "file" | "image" | "asset" | "folder";
  /** Chip text; the link's own text when omitted. */
  label?: string;
  /** Tooltip, such as the full path. */
  title?: string;
}

/** Classifies a link by its transformed href; null keeps an ordinary link. */
export type MarkdownLinkChipResolver = (href: string) => MarkdownLinkChip | null | undefined;

const LINK_CHIP_ICONS: Record<MarkdownLinkChip["kind"], LucideIcon> = {
  file: FileText,
  image: FileImage,
  asset: Package,
  folder: Folder,
};

const LinkChipContext = createContext<MarkdownLinkChipResolver | undefined>(undefined);

// An image already wrapped in a Markdown link keeps that link: anchors cannot nest.
const MarkdownLinkContext = createContext(false);

function MarkdownLink({ node: _node, children, className, ...props }: ComponentProps<"a"> & ExtraProps) {
  const resolveChip = useContext(LinkChipContext);
  const chip = typeof props.href === "string" && props.href ? resolveChip?.(props.href) : null;
  if (!chip) {
    return (
      <MarkdownLinkContext.Provider value>
        <a {...props} className={className}>{children}</a>
      </MarkdownLinkContext.Provider>
    );
  }
  const Icon = LINK_CHIP_ICONS[chip.kind];
  return (
    <MarkdownLinkContext.Provider value>
      <a
        {...props}
        title={chip.title ?? props.title}
        data-link-chip={chip.kind}
        className={cn(
          "not-prose inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-0.5 align-middle text-[0.9375em] font-medium leading-6 text-foreground no-underline transition-colors hover:border-[var(--border-strong)] hover:bg-muted",
          // Out-ranks an older vendored `.tangle-prose a` colour and underline.
          "[.tangle-prose_&]:text-foreground [.tangle-prose_&]:no-underline",
          focusRing,
          className,
        )}
      >
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{chip.label ?? children}</span>
      </a>
    </MarkdownLinkContext.Provider>
  );
}

// Fenced code arrives as <pre><code>; inline code is a bare <code>.
const PreContext = createContext(false);

function MarkdownPre({ children }: ComponentProps<"pre"> & ExtraProps) {
  return <PreContext.Provider value>{children}</PreContext.Provider>;
}

function MarkdownCode({ node, className: codeClass, children: codeChildren, ...rest }: ComponentProps<"code"> & ExtraProps) {
  const fenced = useContext(PreContext);
  const code = String(codeChildren).replace(/\n$/, "");
  if (!fenced) {
    const { "data-meta": _meta, ...attributes } = rest as typeof rest & { "data-meta"?: unknown };
    return (
      <code
        className={cn(
          "px-1.5 py-0.5 rounded border border-border bg-muted text-foreground text-[0.85em] font-mono",
          codeClass,
        )}
        {...attributes}
      >
        {codeChildren}
      </code>
    );
  }
  const { language, filename } = fenceInfo(codeClass, node?.properties?.dataMeta);
  return (
    <CodeBlock code={code} language={language} filename={filename} className="my-4">
      <CopyButton text={code} />
    </CodeBlock>
  );
}

// The default schema plus a fence's info string on <code>, which names its file.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "dataMeta"],
  },
};

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
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      // An image without alt text would otherwise leave the link unnamed.
      aria-label={alt ? undefined : "Open image full size"}
      className="inline-block max-w-full"
    >
      {image}
    </a>
  );
}

export interface MarkdownProps {
  children: string;
  className?: string;
  /** Transform parsed link and image URLs while retaining protocol safety checks. */
  urlTransform?: UrlTransform;
  /** Render links to known objects (a file, an asset) as chips that keep their href. */
  linkChip?: MarkdownLinkChipResolver;
}

/**
 * Renders Markdown content with GFM support and XSS sanitisation: Shiki code
 * blocks that name their file, tables as cards with right-aligned figures and
 * a CSV copy, images that open full size or show a labelled placeholder, and
 * optional chips for links to known objects.
 */
export const Markdown = memo(({ children, className, urlTransform, linkChip }: MarkdownProps) => {
  return (
    <div
      className={cn("tangle-prose max-w-none text-sm", className)}
    >
      <LinkChipContext.Provider value={linkChip}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkCodeMeta]}
          rehypePlugins={[rehypeSlug, [rehypeSanitize, sanitizeSchema]]}
          urlTransform={(url, key, node) => transformMarkdownUrl(url, key, node, urlTransform)}
          components={{
            a: MarkdownLink,
            img: MarkdownImage,
            pre: MarkdownPre,
            code: MarkdownCode,
            table: MarkdownTable,
            thead: MarkdownTableHead,
            tbody: MarkdownTableBody,
            tr: MarkdownTableRow,
            th: MarkdownTableHeaderCell,
            td: MarkdownTableCell,
          }}
        >
          {children}
        </ReactMarkdown>
      </LinkChipContext.Provider>
    </div>
  );
});
Markdown.displayName = "Markdown";

