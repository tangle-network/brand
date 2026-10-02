import { createElement as h } from "react";
import { DocumentEditorPane } from "@tangle-network/ui/editor";

export function Fixture({ markdown = "# Packed editor", readOnly = false } = {}) {
  return h(DocumentEditorPane, {
    title: "Packed document", markdown, mode: "edit", backend: "local", readOnly,
  });
}
