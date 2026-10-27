---
"@tangle-network/ui": patch
---

`codePresentation.header` carries the header's type (`font-sans text-sm`), so a server-rendered code block header built from it shows its label and a text copy button in the header type, not the code font. The React `CodeBlock` label takes it from the header.
