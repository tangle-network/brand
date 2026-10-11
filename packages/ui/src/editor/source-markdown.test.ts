import { describe, expect, it } from "vitest";
import {
  blockHtml,
  blockMarkdown,
  diffText,
  mergeBlockEdit,
  parseSourceMarkdown,
  serializeSourceMarkdown,
  type SourceBlock,
  type SourceMarkdown,
  type SourceNode,
} from "./source-markdown";
import { KITCHEN_SINK } from "./source-markdown.fixtures";

/** The serializer's view of a document nobody edited. */
function untouched(source: SourceMarkdown): SourceNode[] {
  return source.blocks.map((block) => ({
    block,
    unchanged: true,
    sameType: true,
    markdown: () => block.raw,
    merge: () => block.raw,
    reparses: () => true,
  }));
}

/** A node whose Markdown changed to `edited`, merged the way the editor merges it. */
function editedNode(block: SourceBlock, canonical: string, edited: string): SourceNode {
  return {
    block,
    unchanged: false,
    sameType: true,
    markdown: () => edited,
    merge: (text) => mergeBlockEdit(block.raw, canonical, text),
    reparses: () => true,
  };
}

function addedNode(markdown: string): SourceNode {
  return {
    unchanged: false,
    sameType: false,
    markdown: () => markdown,
    merge: () => null,
    reparses: () => true,
  };
}

describe("parseSourceMarkdown", () => {
  it("splits a file into blocks whose bytes reassemble it exactly", () => {
    const source = parseSourceMarkdown(KITCHEN_SINK);
    const rebuilt = source.prefix + source.blocks.map((block) => block.raw + block.gap).join("");
    expect(rebuilt).toBe(KITCHEN_SINK);
    expect(source.prefix).toBe("\n\n");
  });

  it("keeps blocks the editor cannot represent read-only, by what they are", () => {
    const kinds = parseSourceMarkdown(KITCHEN_SINK)
      .blocks.filter((block) => !block.editable)
      .map((block) => block.kind);
    expect(kinds).toEqual(["checklist", "table", "html", "image", "html", "definition"]);
  });

  it("gives the editor a source node for a table, carrying its raw text", () => {
    const table = "| A | B |\n|---|---|\n| 1 | 2 |";
    const source = parseSourceMarkdown(`Intro\n\n${table}\n`);
    expect(source.html).toContain('data-md-kind="table"');
    expect(source.html).toContain('data-md-raw="| A | B |\n|---|---|\n| 1 | 2 |"');
    expect(source.html).toMatch(/^<p data-md-block="m[0-9a-z]+:0">Intro<\/p>/);
  });

  it("keeps CRLF line endings and a missing final newline", () => {
    for (const file of ["one\r\n\r\n- a\r\n- b\r\n", "no final newline", "\ttab start\n\n-\ttab bullet"]) {
      const source = parseSourceMarkdown(file);
      expect(serializeSourceMarkdown(source, untouched(source))).toBe(file);
    }
  });

  it("serializes an untouched file byte for byte", () => {
    const source = parseSourceMarkdown(KITCHEN_SINK);
    expect(serializeSourceMarkdown(source, untouched(source))).toBe(KITCHEN_SINK);
  });

  it("resolves reference links defined elsewhere when it re-reads one block", () => {
    const source = parseSourceMarkdown("See [docs][d].\n\n[d]: https://docs.example\n");
    expect(blockHtml("See [the docs][d].", source.links)).toContain('href="https://docs.example"');
    expect(blockHtml("| a |\n|---|\n| 1 |")).toBeNull();
  });
});

describe("mergeBlockEdit", () => {
  it("keeps escapes the re-serialization would add, outside the edit", () => {
    const raw = "Rename snake_case_name and *keep* it";
    const canonical = "Rename snake\\_case\\_name and *keep* it";
    expect(mergeBlockEdit(raw, canonical, "Rename snake\\_case\\_name and *keep* it now")).toBe(
      "Rename snake_case_name and *keep* it now",
    );
  });

  it("keeps the source's list markers and indentation around an edited item", () => {
    const raw = "* star bullet one\n* star bullet two\n    * nested four-space";
    const canonical = "- star bullet one\n- star bullet two\n  - nested four-space";
    const edited = "- star bullet uno\n- star bullet two\n  - nested four-space";
    expect(mergeBlockEdit(raw, canonical, edited)).toBe(
      "* star bullet uno\n* star bullet two\n    * nested four-space",
    );
  });

  it("keeps a setext heading's underline and underscore emphasis", () => {
    expect(mergeBlockEdit("Setext heading\n==============", "# Setext heading", "# Setext heading two")).toBe(
      "Setext heading two\n==============",
    );
    expect(mergeBlockEdit("an _emphasised_ word", "an *emphasised* word", "an *emphasised* word, edited")).toBe(
      "an _emphasised_ word, edited",
    );
  });

  it("keeps a reference link and a backslash hard break the canonical form spells differently", () => {
    expect(
      mergeBlockEdit(
        "A [ref link][ref] here",
        'A [ref link](https://ref.example "Ref Title") here',
        'A [ref link](https://ref.example "Ref Title") here and there',
      ),
    ).toBe("A [ref link][ref] here and there");
    expect(mergeBlockEdit("one\\\ntwo", "one  \ntwo", "one!  \ntwo")).toBe("one!\\\ntwo");
  });

  it("deletes the source's own spelling of a deleted span", () => {
    expect(mergeBlockEdit("keep snake_case drop", "keep snake\\_case drop", "keep drop")).toBe("keep drop");
  });

  it("returns the original bytes when the edit was undone", () => {
    expect(mergeBlockEdit("* a", "- a", "- a")).toBe("* a");
  });
});

describe("diffText", () => {
  // Seeded, so a failure reproduces.
  function random(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
  }

  it("turns the first text into the second for random edits", () => {
    const next = random(42);
    const alphabet = "ab *_-\n#[]()`\\";
    for (let round = 0; round < 300; round++) {
      const length = Math.floor(next() * 60);
      let a = "";
      for (let i = 0; i < length; i++) a += alphabet[Math.floor(next() * alphabet.length)];
      let b = a;
      const edits = 1 + Math.floor(next() * 4);
      for (let e = 0; e < edits; e++) {
        const at = Math.floor(next() * (b.length + 1));
        const cut = Math.floor(next() * 4);
        const insert = alphabet[Math.floor(next() * alphabet.length)].repeat(Math.floor(next() * 3));
        b = b.slice(0, at) + insert + b.slice(at + cut);
      }
      const ops = diffText(a, b);
      expect(ops).not.toBeNull();
      expect(ops!.filter(([op]) => op !== 1).map(([, text]) => text).join("")).toBe(a);
      expect(ops!.filter(([op]) => op !== -1).map(([, text]) => text).join("")).toBe(b);
    }
  });

  it("gives up past its cost bound rather than allocating without limit", () => {
    expect(diffText("a".repeat(400), "b".repeat(400), 100)).toBeNull();
  });
});

describe("serializeSourceMarkdown", () => {
  const file = "# Title\n\nFirst paragraph.\n\n* one\n* two\n\n| A |\n|---|\n| 1 |\n";

  it("changes only the edited span of an edited block", () => {
    const source = parseSourceMarkdown(file);
    const nodes = untouched(source);
    nodes[2] = editedNode(source.blocks[2], "- one\n- two", "- one\n- two\n- three");
    expect(serializeSourceMarkdown(source, nodes)).toBe(
      "# Title\n\nFirst paragraph.\n\n* one\n* two\n- three\n\n| A |\n|---|\n| 1 |\n",
    );
  });

  it("separates an added block with a blank line and keeps the file's trailer", () => {
    const source = parseSourceMarkdown(file);
    const nodes = untouched(source);
    nodes.splice(2, 0, addedNode("A new paragraph."));
    nodes.push(addedNode("Closing line."));
    expect(serializeSourceMarkdown(source, nodes)).toBe(
      "# Title\n\nFirst paragraph.\n\nA new paragraph.\n\n* one\n* two\n\n| A |\n|---|\n| 1 |\n\nClosing line.\n",
    );
  });

  it("drops a deleted block and its separator only", () => {
    const source = parseSourceMarkdown(file);
    const nodes = untouched(source).filter((_, i) => i !== 1);
    expect(serializeSourceMarkdown(source, nodes)).toBe("# Title\n\n* one\n* two\n\n| A |\n|---|\n| 1 |\n");
  });

  it("skips an empty added paragraph, such as the editor's trailing one", () => {
    const source = parseSourceMarkdown(file);
    expect(serializeSourceMarkdown(source, [...untouched(source), addedNode("")])).toBe(file);
  });

  it("writes added text with the file's CRLF line endings", () => {
    const source = parseSourceMarkdown("one\r\n");
    expect(serializeSourceMarkdown(source, [...untouched(source), addedNode("two\nlines")])).toBe(
      "one\r\n\r\ntwo\r\nlines\r\n",
    );
  });

  it("falls back to the edited block when the merge does not read back as the edit", () => {
    const source = parseSourceMarkdown("* one\n* two\n");
    const node = editedNode(source.blocks[0], "- one\n- two", "- one\n- two\n- three");
    node.reparses = () => false;
    expect(serializeSourceMarkdown(source, [node])).toBe("- one\n- two\n- three\n");
  });
});

describe("blockMarkdown", () => {
  it("writes lists with one space after the marker, in the source's marker style", () => {
    const html = "<ul><li><p>one</p></li><li><p>two</p></li></ul>";
    expect(blockMarkdown(html)).toBe("- one\n- two");
    expect(blockMarkdown(html, "* x")).toBe("* one\n* two");
    expect(blockMarkdown('<ol start="3"><li><p>a</p></li><li><p>b</p></li></ol>', "3) a")).toBe("3) a\n4) b");
  });

  it("writes strikethrough and rules as GFM", () => {
    expect(blockMarkdown("<p><s>gone</s></p>")).toBe("~~gone~~");
    expect(blockMarkdown("<hr>")).toBe("---");
  });
});
