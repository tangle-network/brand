import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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
});
