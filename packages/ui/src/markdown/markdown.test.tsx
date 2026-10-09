import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { getSanitizedMarkdownHeadingIdFromRawFragment, Markdown } from "./markdown";

describe("Markdown", () => {
  it("uses the tokenized Tangle prose class instead of host typography defaults", () => {
    const { container } = render(<Markdown>{"# Heading\n\nBody with `code`."}</Markdown>);
    const surface = container.firstElementChild;

    expect(surface).toHaveClass("tangle-prose");
    expect(surface).not.toHaveClass("prose");
    expect(surface).not.toHaveClass("dark:prose-invert");
  });

  it("adds GitHub-style Unicode and duplicate heading IDs before sanitizing them", () => {
    const { container } = render(
      <Markdown>{"# Duplicate\n\n## Crème brûlée\n\n# Duplicate\n\n# user-content-heading"}</Markdown>,
    );

    expect(container.querySelectorAll("h1, h2")).toHaveLength(4);
    expect(container.querySelector("h2")).toHaveAttribute("id", "user-content-crème-brûlée");
    expect(container.querySelectorAll("h1")[0]).toHaveAttribute("id", "user-content-duplicate");
    expect(container.querySelectorAll("h1")[1]).toHaveAttribute("id", "user-content-duplicate-1");
    expect(container.querySelectorAll("h1")[2]).toHaveAttribute(
      "id",
      "user-content-user-content-heading",
    );
  });

  it("maps raw fragments exactly once to the sanitized target prefix", () => {
    expect(getSanitizedMarkdownHeadingIdFromRawFragment("Cr%C3%A8me%20br%C3%BBl%C3%A9e"))
      .toBe("user-content-crème-brûlée");
    expect(getSanitizedMarkdownHeadingIdFromRawFragment("user-content-heading"))
      .toBe("user-content-user-content-heading");
  });

  it("maps same-document fragments to sanitized heading IDs", () => {
    render(<Markdown>{"[Jump](#Cr%C3%A8me%20br%C3%BBl%C3%A9e)\n\n# Crème brûlée"}</Markdown>);

    expect(screen.getByRole("link", { name: "Jump" })).toHaveAttribute(
      "href",
      "#user-content-crème-brûlée",
    );
  });

  it("keeps custom URL transforms behind ReactMarkdown protocol checks", () => {
    const urlTransform = vi.fn((url: string) => url);

    render(
      <Markdown urlTransform={urlTransform}>
        {"[External](https://example.com/docs#install)\n\n![Safe](https://example.com/image.png)\n\n![Unsafe](javascript:alert(1))"}
      </Markdown>,
    );

    expect(screen.getByRole("link", { name: "External" })).toHaveAttribute(
      "href",
      "https://example.com/docs#install",
    );
    expect(screen.getByRole("img", { name: "Safe" })).toHaveAttribute(
      "src",
      "https://example.com/image.png",
    );
    expect(screen.getByRole("img", { name: "Image unavailable: Unsafe" })).not.toHaveAttribute("src");
    expect(urlTransform).toHaveBeenCalledWith(
      "https://example.com/image.png",
      "src",
      expect.objectContaining({ tagName: "img" }),
    );
  });

  it("keeps inline code on semantic tokens", () => {
    const { container } = render(<Markdown>{"Use `token` values."}</Markdown>);
    const inlineCode = container.querySelector("code");

    expect(inlineCode).toHaveClass("border-border");
    expect(inlineCode).toHaveClass("bg-muted");
    expect(inlineCode).toHaveClass("text-foreground");
  });

  it("passes parsed URLs through the typed transform hook", () => {
    const urlTransform = vi.fn((url: string, key: string) => (
      key === "href" && url === "system/brief.md"
        ? "/app/ws-1/vault?file=system%2Fbrief.md"
        : url
    ));

    render(
      <Markdown urlTransform={urlTransform}>
        {'[Brief](system/brief.md)'}
      </Markdown>,
    );

    expect(screen.getByRole("link", { name: "Brief" })).toHaveAttribute(
      "href",
      "/app/ws-1/vault?file=system%2Fbrief.md",
    );
    expect(urlTransform).toHaveBeenCalledWith(
      "system/brief.md",
      "href",
      expect.objectContaining({ tagName: "a" }),
    );
  });

  it("links an image to its full-size source unless a Markdown link already wraps it", () => {
    render(
      <Markdown>
        {"![Ad](https://example.com/ad.png)\n\n[![Badge](https://example.com/badge.svg)](https://example.com/docs)"}
      </Markdown>,
    );

    const ad = screen.getByRole("img", { name: "Ad" });
    expect(ad).toHaveAttribute("src", "https://example.com/ad.png");
    expect(ad.closest("a")).toHaveAttribute("href", "https://example.com/ad.png");
    expect(ad.closest("a")).toHaveAttribute("target", "_blank");
    expect(ad.closest("a")).toHaveAttribute("rel", "noopener noreferrer");

    render(<Markdown>{"![](https://example.com/decorative.png)"}</Markdown>);
    expect(screen.getByRole("link", { name: "Open image full size" })).toHaveAttribute(
      "href",
      "https://example.com/decorative.png",
    );

    const badge = screen.getByRole("img", { name: "Badge" });
    expect(badge.closest("a")).toHaveAttribute("href", "https://example.com/docs");
    expect(badge.closest("a")?.parentElement?.closest("a")).toBeNull();
  });

  it("replaces an image that fails to load with a labelled placeholder", () => {
    render(<Markdown>{"![Final ad](campaigns/missing.png)"}</Markdown>);

    fireEvent.error(screen.getByRole("img", { name: "Final ad" }));

    expect(screen.queryByRole("img", { name: "Final ad" })).toBeNull();
    expect(screen.getByRole("img", { name: "Image unavailable: Final ad" })).toHaveTextContent(
      "Image unavailable: Final ad",
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a fenced block's file name and highlights it as that file's language", () => {
    render(<Markdown>{'```ts title="src/lib/ctr.ts"\nexport const x = 1;\n```'}</Markdown>);
    expect(screen.getByText("src/lib/ctr.ts")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
  });

  it("renders a single-line fence without a language as a block, not inline code", () => {
    const { container } = render(<Markdown>{"```\nnpm run build\n```\n\nRun `npm test` too."}</Markdown>);
    expect(container.querySelectorAll("pre")).toHaveLength(1);
    expect(container.querySelector("pre")?.textContent).toBe("npm run build");
    expect(container.querySelector("p code")?.textContent).toBe("npm test");
  });

  it("renders links the host classifies as chips that keep their href", () => {
    render(
      <Markdown linkChip={(href) => href.startsWith("/vault/") ? { kind: "file", label: "REVIEW.md", title: "campaigns/REVIEW.md" } : null}>
        {"See [the review](/vault/REVIEW.md) and [docs](https://example.com)."}
      </Markdown>,
    );
    const chip = screen.getByRole("link", { name: "REVIEW.md" });
    expect(chip.getAttribute("href")).toBe("/vault/REVIEW.md");
    expect(chip.getAttribute("data-link-chip")).toBe("file");
    expect(chip.getAttribute("title")).toBe("campaigns/REVIEW.md");
    expect(screen.getByRole("link", { name: "docs" }).hasAttribute("data-link-chip")).toBe(false);
  });
});
