import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Markdown } from "./markdown";

afterEach(cleanup);

it("keeps completed code selectable across chunks and matches a fresh render after edits", async () => {
  const fenced = (code: string, language = "ts") => ["```" + language, code, "```"].join("\n");
  const source = "/* A comment\ncontinues here. */\nconst message = `first\nsecond`;";
  const chat = render(<Markdown>{fenced(source)}</Markdown>);
  const ready = (host: Element) => waitFor(() => expect(host.querySelector('[data-highlighted="true"]')).toBeTruthy());
  await ready(chat.container);
  const firstToken = chat.container.querySelector("pre code > span > span")!;
  const selection = window.getSelection()!;
  selection.selectAllChildren(firstToken);
  const selected = selection.toString();
  expect(selected).not.toBe("");

  for (const suffix of ["\nconst", "\nconst n = 3;", "\nconst n = 3;\r\n\n/* done */"]) {
    chat.rerender(<Markdown>{fenced(source + suffix)}</Markdown>);
    expect(chat.container.querySelector("pre code > span > span")).toBe(firstToken);
    expect(selection.toString()).toBe(selected);
    await ready(chat.container);
    const fresh = render(<Markdown>{fenced(source + suffix)}</Markdown>);
    await ready(fresh.container);
    expect(chat.container.querySelector("pre code")!.innerHTML).toEqual(fresh.container.querySelector("pre code")!.innerHTML);
    fresh.unmount();
  }
  const replacement = '{"count":7}';
  chat.rerender(<Markdown>{fenced(replacement, "json")}</Markdown>);
  await ready(chat.container);
  expect(chat.container.querySelector("pre code")!.textContent).toBe(replacement);
  expect(chat.container.contains(firstToken)).toBe(false);
});

it("renders native section links at every depth with stable, unique IDs and preserved inline links", () => {
  const source = [
    "# Getting started", "## Stable", "### [Guide](/guide) and `CLI` {#stable}",
    "#### Déjà vu", "##### Déjà vu", "###### 重複", "###### 重複",
    "## User content {#user-content-stable}",
    "[Deep section](#stable) and [old outline](#user-content-stable)",
  ].join("\n\n");
  const view = render(<Markdown headingPermalinks>{source}</Markdown>);
  const headings = view.getAllByRole("heading");
  const names = ["getting-started", "stable-1", "stable", "déjà-vu", "déjà-vu-1", "重複", "重複-1", "user-content-stable"];
  expect(headings.map((node) => node.id)).toEqual(names.map((name) => `user-content-${name}`));
  headings.forEach((node, index) => {
    const link = node.querySelector(".md-heading-permalink")!;
    const fragment = decodeURIComponent(link.getAttribute("href")!.slice(1));
    const target = document.getElementById(fragment) ?? document.getElementsByName(fragment)[0];
    expect(target?.closest("h1,h2,h3,h4,h5,h6")).toBe(node);
    expect(fragment).toBe(index === names.length - 1 ? node.id : names[index]);
  });
  expect(view.getByRole("link", { name: "Guide" }).getAttribute("href")).toBe("/guide");
  expect(view.getByRole("link", { name: "Deep section" }).getAttribute("href")).toBe("#stable");
  expect(view.getByRole("link", { name: "old outline" }).getAttribute("href")).toBe("#user-content-stable");
  expect(view.container.querySelector("a a")).toBeNull();
  view.rerender(<Markdown>{source}</Markdown>);
  expect(view.container.querySelector("a[name]")).toBeNull();
});

it("keeps pending inline markers out of a streamed answer and preserves settled CommonMark", () => {
  const base = "Income (**MAGI**) between **$79,000** and ";
  const chat = render(<Markdown streaming>{base}</Markdown>);
  for (const mark of ["**", "*", "__", "_", "`", "``", "["]) {
    for (const suffix of [mark, mark + "more"]) {
      chat.rerender(<Markdown streaming>{base + suffix}</Markdown>);
      expect(chat.container.textContent?.trimEnd()).toBe("Income (MAGI) between $79,000 and" + (suffix === mark ? "" : " more"));
      expect(chat.container.querySelector("a")).toBeNull();
    }
    chat.rerender(<Markdown>{base + mark}</Markdown>);
    expect(chat.container.textContent).toContain(mark);
  }
  for (const text of ["**done**", "_done_", "file_name", "\\*literal", "`**`", "[link](/guide)"]) {
    chat.rerender(<Markdown streaming>{text}</Markdown>);
    const expected = render(<Markdown>{text}</Markdown>);
    expect(chat.container.innerHTML).toBe(expected.container.innerHTML);
    expected.unmount();
  }
});

it("typesets research notation while preserving prices, code and link policy", () => {
  const source = [
    String.raw`The roots of $x^2=4$ are \(\pm 2\). $5–$10 and $20 to $35 are prices. A literal \$5 follows.`,
    String.raw`$$\frac{1}{2}$$`,
    String.raw`\[` + "\n" + String.raw`\sum_{n=1}^{3} n = 6` + "\n" + String.raw`\]`,
    ["```tex", String.raw`$x$ and \(y\)`, "```"].join("\n"),
    "The printed edition costs $25. Inline `$z$`. [Paper](https://example.org/paper) [unsafe](javascript:alert).",
    String.raw`$5, then **$t$** and $2^3$.`,
    String.raw`$\href{javascript:alert(1)}{unsafe}$`,
  ].join("\n\n");
  const chat = render(<Markdown>{source}</Markdown>);
  for (const streaming of [false, true]) {
    chat.rerender(<Markdown streaming={streaming}>{source}</Markdown>);
    const math = [...chat.container.querySelectorAll("math")];
    expect(math.slice(0, 4).map((el) => el.querySelector("annotation")?.textContent)).toEqual([
      "x^2=4", String.raw`\pm 2`, String.raw`\frac{1}{2}`, String.raw`\sum_{n=1}^{3} n = 6`,
    ]);
    expect(math.filter((el) => el.getAttribute("display") === "block")).toHaveLength(2);
    expect(math.map((el) => el.querySelector("annotation")?.textContent)).toContain("t");
    expect(math.map((el) => el.querySelector("annotation")?.textContent)).toContain("2^3");
    expect(chat.container.textContent).toContain("The printed edition costs $25. Inline $z$.");
    expect(chat.container.querySelector("msup")).toBeTruthy();
    expect(chat.container.querySelector("mfrac")).toBeTruthy();
    expect(chat.container.textContent).toContain("$5–$10 and $20 to $35 are prices. A literal $5 follows.");
    expect(chat.container.querySelector("pre code")?.textContent).toContain(String.raw`$x$ and \(y\)`);
    expect(chat.container.querySelector("p code")?.textContent).toBe("$z$");
    expect(chat.getByRole("link", { name: "Paper" }).getAttribute("href")).toBe("https://example.org/paper");
    expect(chat.container.querySelector('[href^="javascript:"]')).toBeNull();
  }
});
