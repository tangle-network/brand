import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import GithubSlugger from "github-slugger";
import { Link2 } from "lucide-react";
import type { ComponentProps } from "react";
import type { Components, ExtraProps } from "react-markdown";
import { visit } from "unist-util-visit";

const explicitId = /\s+\{#([\p{L}\p{N}_-]+)\}\s*$/u;
const sanitizedPrefix = "user-content-";

/** Use GitHub's duplicate and Unicode rules and reserve authored IDs before automatic ones. */
export function rehypePermalinkIds() {
  return (root: Root) => {
    const slugger = new GithubSlugger();
    const headings: Element[] = [];
    visit(root, "element", (node) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      headings.push(node);
      const last = node.children.at(-1);
      if (last?.type !== "text") return;
      const match = explicitId.exec(last.value);
      if (!match) return;
      last.value = last.value.slice(0, match.index);
      node.properties.id = slugger.slug(match[1], true);
    });
    for (const node of headings) {
      if (!node.properties.id) node.properties.id = slugger.slug(toString(node)) || slugger.slug("section");
    }
  };
}

function heading(tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  const Tag = tag;
  return function LinkedHeading({ node, children, id, ...props }: ComponentProps<"h2"> & ExtraProps) {
    const label = node && toString(node);
    if (!id || !label) return <Tag {...props} id={id}>{children}</Tag>;
    const title = `Link to ${label}`;
    // Keep the sanitizer's heading ID (also used by existing outlines). A named
    // anchor gives GitHub-style short fragments a native no-JavaScript target.
    const slug = id.slice(sanitizedPrefix.length);
    // A short slug such as "user-content-install" may already identify a
    // different heading. Its sanitized ID always identifies this heading.
    const name = slug.startsWith(sanitizedPrefix) ? undefined : slug;
    return (
      <Tag {...props} id={id} aria-label={label} className="relative">
        {children}{" "}
        <a {...{ name }} href={`#${encodeURIComponent(name || id)}`} className="md-heading-permalink inline-flex size-7 items-center justify-center align-middle text-muted-foreground hover:text-foreground focus-visible:outline-2" aria-label={title} title={title}>
          <Link2 aria-hidden="true" className="size-4" />
        </a>
      </Tag>
    );
  };
}

export const permalinkHeadings: Components = {
  h1: heading("h1"), h2: heading("h2"), h3: heading("h3"),
  h4: heading("h4"), h5: heading("h5"), h6: heading("h6"),
};
