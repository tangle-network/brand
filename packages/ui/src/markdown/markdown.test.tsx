import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("img", { name: "Unsafe" })).not.toHaveAttribute("src");
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
});

