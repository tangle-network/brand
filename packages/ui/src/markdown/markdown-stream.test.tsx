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
    "[Deep section](#stable) and [old outline](#user-content-stable)",
  ].join("\n\n");
  const view = render(<Markdown headingPermalinks>{source}</Markdown>);
  const headings = view.getAllByRole("heading");
  const names = ["getting-started", "stable-1", "stable", "déjà-vu", "déjà-vu-1", "重複", "重複-1"];
  expect(headings.map((node) => node.id)).toEqual(names.map((name) => `user-content-${name}`));
  headings.forEach((node, index) => {
    const link = node.querySelector("a[name]");
    expect(link?.getAttribute("name")).toBe(names[index]);
    expect(decodeURIComponent(link?.getAttribute("href") ?? "")).toBe(`#${node.id}`);
  });
  expect(view.getByRole("link", { name: "Guide" }).getAttribute("href")).toBe("/guide");
  expect(view.getByRole("link", { name: "Deep section" }).getAttribute("href")).toBe("#stable");
  expect(view.getByRole("link", { name: "old outline" }).getAttribute("href")).toBe("#user-content-stable");
  expect(view.container.querySelector("a a")).toBeNull();
  view.rerender(<Markdown>{source}</Markdown>);
  expect(view.container.querySelector("a[name]")).toBeNull();
});
