import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("uses the tokenized Tangle prose class instead of host typography defaults", () => {
    const { container } = render(<Markdown>{"# Heading\n\nBody with `code`."}</Markdown>);
    const surface = container.firstElementChild;

    expect(surface).toHaveClass("tangle-prose");
    expect(surface).not.toHaveClass("prose");
    expect(surface).not.toHaveClass("dark:prose-invert");
  });

  it("keeps inline code on semantic tokens", () => {
    const { container } = render(<Markdown>{"Use `token` values."}</Markdown>);
    const inlineCode = container.querySelector("code");

    expect(inlineCode).toHaveClass("border-border");
    expect(inlineCode).toHaveClass("bg-card");
    expect(inlineCode).toHaveClass("text-[var(--code-keyword)]");
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
