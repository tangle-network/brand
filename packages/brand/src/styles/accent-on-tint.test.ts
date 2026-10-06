import { describe, expect, it } from "vitest";
import { compositeOver, contrastRatio } from "./css-test-utils";
import { resolve, scopes } from "./theme-scopes";

/**
 * Selected and active states draw accent text on a primary tint: a selected
 * filter chip or tab is `text-primary` (`--accent-text`) on `bg-primary/10` or
 * `bg-primary/15`, and a count badge inside it adds another tint on top. That
 * text is body-sized, so WCAG 1.4.3 asks 4.5:1 against the tinted fill, not
 * only against the bare surface the other suites check.
 *
 * This suite composites the primary fill at each opacity products use over
 * every surface a selected item sits on, in every scope a consumer can select,
 * and holds the accent text to 4.5:1 on each result.
 */
const TINTS = [0.1, 0.15, 0.2] as const;
const SURFACES = [
  ["canvas", "hsl-background"],
  ["card", "hsl-card"],
  ["muted", "hsl-muted"],
] as const;

describe("accent text reads on the selected tint in every theme scope", () => {
  for (const { name, sources } of scopes) {
    it(name, () => {
      const accentText = resolve(sources, "accent-text");
      const primary = resolve(sources, "hsl-primary");
      for (const [surfaceName, token] of SURFACES) {
        const surface = resolve(sources, token);
        for (const alpha of TINTS) {
          const tint = compositeOver(primary, surface, alpha);
          expect(
            contrastRatio(accentText, tint),
            `accent text on primary/${alpha * 100} over ${surfaceName}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});
