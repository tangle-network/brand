import {
  Link as RRLink,
  NavLink as RRNavLink,
  type LinkProps,
  type NavLinkProps,
} from "react-router";

/**
 * Navigation primitives that make agent-app products feel snappy by default.
 *
 * The dominant source of the "1–2s when I click through pages" latency in the
 * fleet is NOT slow queries (route loaders' D1 indexes already cover their
 * filters) — it is that every click is a COLD loader round-trip the user waits
 * on, because bare `<Link>`s do no prefetching. React Router can fire the
 * target route's loader on hover/focus (`prefetch="intent"`), overlapping the
 * round-trip with the user's mouse travel so the transition feels instant.
 *
 * These wrappers default `prefetch="intent"` so a product gets that behaviour
 * by importing the shared `<Link>` instead of remembering the flag on every
 * nav element. The default is overridable — a caller that passes `prefetch`
 * wins (the spread is applied after the default).
 */

/** `react-router` `<Link>` with `prefetch="intent"` on by default. */
export function Link({ prefetch = "intent", ...props }: LinkProps) {
  return <RRLink prefetch={prefetch} {...props} />;
}

/** `react-router` `<NavLink>` with `prefetch="intent"` on by default. */
export function NavLink({ prefetch = "intent", ...props }: NavLinkProps) {
  return <RRNavLink prefetch={prefetch} {...props} />;
}

export type { LinkProps, NavLinkProps } from "react-router";
