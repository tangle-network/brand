import type {} from "remark-parse";
import type { Root } from "mdast";
import { mathFromMarkdown } from "mdast-util-math";
import { math } from "micromark-extension-math-extended";
import type { Construct, State } from "micromark-util-types";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Pandoc's single-dollar boundaries keep prices such as "$5 to $10" literal.
// The Markdown tokenizer already owns escapes, links, code spans and fences.
const singleDollar: Construct = {
  name: "singleDollarMath",
  previous: (code) => code !== 36,
  tokenize(effects, ok, nok) {
    let previousWasSpace = false;
    let escaped = false;
    let startsWithDigit = false;
    const start: State = (code) => {
      effects.enter("mathText");
      effects.enter("mathTextSequence");
      effects.consume(code);
      effects.exit("mathTextSequence");
      return first;
    };
    const first: State = (code) => {
      if (code === null || code <= 32 || code === 36) return nok(code);
      startsWithDigit = code >= 48 && code <= 57;
      effects.enter("mathTextData");
      return body(code);
    };
    const body: State = (code) => {
      if (code === null || code < 0 || code === 96) return nok(code);
      if (code === 36 && !escaped) {
        if (previousWasSpace) return nok(code);
        effects.exit("mathTextData");
        effects.enter("mathTextSequence");
        effects.consume(code);
        effects.exit("mathTextSequence");
        effects.exit("mathText");
        return end;
      }
      escaped = code === 92 && !escaped;
      previousWasSpace = code <= 32;
      effects.consume(code);
      return body;
    };
    const end: State = (code) => {
      if (code === null) return ok(code);
      // In "$5, then **$x$**", the dollar before x starts the next expression.
      const nextWord = startsWithDigit && /\p{L}/u.test(String.fromCodePoint(Math.max(0, code)));
      return code === 36 || (code >= 48 && code <= 57) || nextWord ? nok(code) : ok(code);
    };
    return start;
  },
};

export const remarkMath: Plugin<[], Root> = function () {
  const data = this.data();
  const syntax = math({ singleDollarTextMath: false });
  (data.micromarkExtensions ??= []).push(syntax, { text: { 36: singleDollar } });
  (data.fromMarkdownExtensions ??= []).push(mathFromMarkdown());
  return (tree, file) => {
    // A pair of double dollars on the same line is parsed as text math.
    const source = String(file);
    visit(tree, "inlineMath", (node) => {
      const offset = node.position?.start.offset;
      if (offset !== undefined && source.startsWith("$$", offset) && node.data) {
        node.data.hName = "span";
        node.data.hProperties = { className: ["math-display"] };
      }
    });
  };
};
