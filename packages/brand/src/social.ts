export interface SocialImage {
  url: string;
  type: "image/png" | "image/jpeg" | "image/webp";
  width: number;
  height: number;
  alt: string;
}

export interface SocialVideo {
  url: string;
  type: "video/mp4" | "video/webm";
  width: number;
  height: number;
}

export interface SocialPage {
  url: string;
  title: string;
  description: string;
  image: SocialImage;
  video?: SocialVideo;
  type?: "website" | "article";
  siteName?: string;
}

export type SocialMetaTag =
  | { property: string; content: string; name?: never }
  | { name: string; content: string; property?: never };

function httpsUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Social metadata requires HTTPS URLs without credentials");
  }
  return url;
}

function mediaTags(
  kind: "image" | "video",
  media: SocialImage | SocialVideo,
): SocialMetaTag[] {
  const url = httpsUrl(media.url).href;
  if (![media.width, media.height].every((size) => Number.isSafeInteger(size) && size > 0)) {
    throw new Error(`Social ${kind} dimensions must be positive pixel counts`);
  }
  const types = kind === "image"
    ? ["image/png", "image/jpeg", "image/webp"]
    : ["video/mp4", "video/webm"];
  if (!types.includes(media.type)) throw new Error(`Unsupported social ${kind} MIME type`);
  return [
    { property: `og:${kind}`, content: url },
    { property: `og:${kind}:secure_url`, content: url },
    { property: `og:${kind}:type`, content: media.type },
    { property: `og:${kind}:width`, content: String(media.width) },
    { property: `og:${kind}:height`, content: String(media.height) },
  ];
}

/** Render these tags in the server/static head, never after hydration.
 * Video metadata advertises an asset; a social client's playback needs its own proof.
 */
export function socialMetadata(page: SocialPage): {
  canonicalUrl: string;
  tags: SocialMetaTag[];
} {
  for (const text of [page.title, page.description, page.image.alt]) {
    if (!text.trim()) throw new Error("Social title, description and image alt must be nonempty");
  }
  const canonical = httpsUrl(page.url);
  canonical.search = "";
  canonical.hash = "";
  const canonicalUrl = canonical.href;
  const imageUrl = httpsUrl(page.image.url).href;
  return {
    canonicalUrl,
    tags: [
      { property: "og:type", content: page.type ?? "website" },
      { property: "og:site_name", content: page.siteName ?? "Tangle" },
      { property: "og:url", content: canonicalUrl },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      ...mediaTags("image", page.image),
      { property: "og:image:alt", content: page.image.alt },
      ...(page.video ? mediaTags("video", page.video) : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@tangle_network" },
      { name: "twitter:title", content: page.title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: page.image.alt },
    ],
  };
}
