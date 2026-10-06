---
"@tangle-network/ui": minor
---

Pagination: add a link mode for lists paged by URL. Pass `hrefFor` (zero-based page in, URL out) instead of `onPageChange` and each enabled control renders as a link, through `linkComponent` (default `"a"`) when a router link is needed. The current page carries `aria-current="page"`, and a disabled previous or next renders as a `<span aria-disabled="true">` with no `href`. `PaginationProps` is now a union of `PaginationButtonProps` and `PaginationLinkProps`; button mode is unchanged.
