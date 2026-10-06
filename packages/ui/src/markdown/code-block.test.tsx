import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import SyntaxHighlighter from "react-syntax-highlighter";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeBlock, CopyButton } from "./code-block";

afterEach(cleanup);

describe("CodeBlock scoped semantic colors", () => {
  it("keeps code readable before the renderer loads, then applies live semantic colors and line numbers", async () => {
    const { container } = render(<CodeBlock code={'const message = "hello";'} language="javascript" showLineNumbers />);
    expect(container.querySelector("pre code")?.textContent).toBe('const message = "hello";');
    await waitFor(() => expect(container.innerHTML).toContain("var(--syntax-keyword, currentColor)"));
    expect(container.innerHTML).toContain("var(--syntax-string, currentColor)");
    expect(container.innerHTML).toContain("var(--syntax-comment, currentColor)");
    expect(container.querySelector(".react-syntax-highlighter-line-number")).not.toBeNull();
    expect(container.querySelector("pre code")?.textContent?.replace(/^1/, "")).toBe('const message = "hello";');
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

  it("server-renders readable code with the same semantic references independent of document theme", () => {
    const source = <CodeBlock code="const x = 1" language="javascript" />;
    document.documentElement.className = "dark";
    const dark = renderToString(source);
    expect(dark).toContain("const x = 1");
    expect(dark).toContain("var(--syntax-foreground, currentColor)");
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

  it.each([
    ["javascript", "const answer = 42;"],
    ["js", "const answer = 42;"],
    ["brainfuck", "++[>+++<-]"],
    ["not-a-language", "const answer = 42;"],
  ])("keeps the default highlighter's tokens for language %s", async (language, code) => {
    const baseline = document.createElement("div");
    baseline.innerHTML = renderToString(<SyntaxHighlighter language={language}>{code}</SyntaxHighlighter>);
    const expected = Array.from(baseline.querySelectorAll("pre code span"), (span) => span.textContent);
    expect(expected.length).toBeGreaterThan(0);

    const { container } = render(<CodeBlock code={code} language={language} />);
    await waitFor(() => expect(container.querySelectorAll("pre code span").length).toBe(expected.length));
    expect(Array.from(container.querySelectorAll("pre code span"), (span) => span.textContent)).toEqual(expected);
    expect(container.querySelector("pre code")?.textContent).toBe(code);
  });

  it("preserves whitespace and line numbering after the renderer loads", async () => {
    const code = "\tfirst  \n  second\n";
    const baseline = document.createElement("div");
    baseline.innerHTML = renderToString(<SyntaxHighlighter language="text" showLineNumbers>{code}</SyntaxHighlighter>);
    const { container } = render(<CodeBlock code={code} language="text" showLineNumbers />);
    expect(container.querySelector("pre code")?.textContent).toBe(code);
    await waitFor(() => expect(container.querySelectorAll(".react-syntax-highlighter-line-number").length)
      .toBe(baseline.querySelectorAll(".react-syntax-highlighter-line-number").length));
    expect(container.querySelector("pre code")?.textContent).toBe(baseline.querySelector("pre code")?.textContent);
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

  it("names the copy button, keeps it out of forms, and announces the copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CopyButton text="secret" />);
    const button = screen.getByRole("button", { name: "Copy to clipboard" });
    expect(button.getAttribute("type")).toBe("button");
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("");
    fireEvent.click(button);
    await waitFor(() => expect(status.textContent).toBe("Copied to clipboard"));
    expect(writeText).toHaveBeenCalledWith("secret");
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("renders the header label at the 12px text-xs step", () => {
    const { getByText } = render(<CodeBlock code={"x"} label="YAML" />);
    expect(getByText("YAML").className).toContain("text-xs");
    expect(getByText("YAML").className).not.toContain("calc(");
  });

  it("announces a failed copy", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<CopyButton text="secret" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Copy failed"));
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeTruthy();
    warn.mockRestore();
  });
});
