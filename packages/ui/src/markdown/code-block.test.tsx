import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { CodeBlock, CopyButton } from "./code-block";

afterEach(cleanup);

describe("CodeBlock scoped semantic colors", () => {
  it("emits live CSS variables through the real highlighter, not sampled root colors", () => {
    const { container } = render(<CodeBlock code={'const message = "hello";'} language="javascript" showLineNumbers />);
    expect(container.innerHTML).toContain("var(--syntax-keyword, currentColor)");
    expect(container.innerHTML).toContain("var(--syntax-string, currentColor)");
    expect(container.innerHTML).toContain("var(--syntax-comment, currentColor)");
  });

  it("inherits a named scope by default without inserting its own mode", () => {
    const { container } = render(<section data-theme="arena-light"><CodeBlock data-testid="code" code="const x = 1" language="javascript" /></section>);
    const code = screen.getByTestId("code");
    expect(code.hasAttribute("data-theme")).toBe(false);
    const before = code.innerHTML;
    container.querySelector("section")!.setAttribute("data-theme", "arena");
    expect(code.innerHTML).toBe(before); // References stay live; the browser fixture checks the computed colors.
  });

  it.each([true, false])("preserves explicit light=%s as an opposite nested mode", (light) => {
    render(<section data-theme={light ? "dark" : "light"}><CodeBlock data-testid="code" code="x" light={light} /></section>);
    expect(screen.getByTestId("code").getAttribute("data-theme")).toBe(light ? "light" : "dark");
  });

  it("preserves caller attributes, labels, children and custom scopes", () => {
    render(<CodeBlock data-testid="code" data-theme="aubergine" className="caller" code="echo hello" language="bash" label="BASHRC"><button>Copy example</button></CodeBlock>);
    expect(screen.getByTestId("code").getAttribute("data-theme")).toBe("aubergine");
    expect(screen.getByTestId("code").classList.contains("caller")).toBe(true);
    expect(screen.getByText("BASHRC")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy example" })).toBeTruthy();
  });

  it("server-renders the same semantic references independent of document theme", () => {
    const source = <CodeBlock code="const x = 1" language="javascript" />;
    document.documentElement.className = "dark";
    const dark = renderToString(source);
    document.documentElement.className = "light";
    expect(renderToString(source)).toBe(dark);
    document.documentElement.removeAttribute("class");
  });
});

// Retain the existing header/label/copy-slot contracts alongside theme coverage.
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
