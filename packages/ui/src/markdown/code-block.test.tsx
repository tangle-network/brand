import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CodeBlock, CopyButton } from "./code-block";

describe("CodeBlock", () => {
  it("renders the code through the syntax highlighter", () => {
    const { container } = render(<CodeBlock code={"const x = 1;"} language="typescript" />);
    expect(container.querySelector("code")).not.toBeNull();
  });

  it("uses `label` as the header text, overriding `language`", () => {
    const { getByText, queryByText } = render(
      <CodeBlock code={"x"} language="typescript" label="config.ts" />,
    );
    expect(getByText("config.ts")).toBeInTheDocument();
    expect(queryByText("typescript")).toBeNull();
  });

  it("falls back to `language` for the header when no `label` is given", () => {
    const { getByText } = render(<CodeBlock code={"x"} language="python" />);
    expect(getByText("python")).toBeInTheDocument();
  });

  it("renders no header when neither label nor language is set", () => {
    const { container } = render(<CodeBlock code={"x"} />);
    // The header is the only element carrying a bottom border.
    expect(container.querySelector(".border-b")).toBeNull();
  });

  it("treats an explicit empty label as 'no header', even with a language", () => {
    const { container, queryByText } = render(
      <CodeBlock code={"x"} language="python" label="" />,
    );
    expect(container.querySelector(".border-b")).toBeNull();
    expect(queryByText("python")).toBeNull();
  });

  it("places children in the header when a header is shown", () => {
    const { container } = render(
      <CodeBlock code={"x"} label="run.ts">
        <CopyButton text="x" />
      </CodeBlock>,
    );
    const copyButton = container.querySelector('button[title="Copy to clipboard"]');
    expect(copyButton).not.toBeNull();
    // Inside the bordered header, not the absolute hover overlay.
    expect(copyButton?.closest(".border-b")).not.toBeNull();
    expect(copyButton?.closest(".absolute")).toBeNull();
  });

  it("moves children to a hover overlay when no header is shown", () => {
    const { container } = render(
      <CodeBlock code={"x"}>
        <CopyButton text="x" />
      </CodeBlock>,
    );
    const copyButton = container.querySelector('button[title="Copy to clipboard"]');
    expect(copyButton).not.toBeNull();
    expect(copyButton?.closest(".absolute")).not.toBeNull();
    expect(copyButton?.closest(".border-b")).toBeNull();
  });
});
