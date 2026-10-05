---
"@tangle-network/ui": patch
---

Each scrollable terminal output region carries `role="region"`, so its `aria-label` (stdout, stderr, error) names a landmark screen readers announce. A label on a bare `<pre>` is prohibited ARIA, and axe flagged it on the platform run page.
