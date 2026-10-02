import { createElement as h } from "react";
import { Markdown, CodeBlock, CopyButton } from "@tangle-network/ui/markdown";
import { CodeBlock as LegacyCodeBlock, CopyButton as LegacyCopyButton } from "@tangle-network/ui/primitives";

export const compatibility = CodeBlock === LegacyCodeBlock && CopyButton === LegacyCopyButton;
export function Fixture() {
  return h(Markdown, null, "# Packed markdown\n\n```js\nconst packedAnswer = 42;\n```\n");
}
