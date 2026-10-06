import { describe, expect, it } from "vitest";
import { contrastRatio } from "./css-test-utils";
import { resolve, scopes, themes } from "./theme-scopes";

/**
 * The token pairs @tangle-network/ui's Switch is drawn with.
 *
 * A switch is non-text content, so WCAG 1.4.11 asks 3:1 for the parts that show
 * its state: the track's edge against the surface it sits on, and the thumb
 * against the track. Off is a muted-foreground outline and thumb on the
 * surface. On is an accent-text track carrying a card-coloured thumb, so the
 * thumb-on-track pair is the same pair as track-on-card, inverted. The primary
 * fill cannot do this job: it is tuned to carry white text and measures about
 * 2.4:1 on the dark card and canvas.
 *
 * These are text tokens, held to 4.5:1 elsewhere for SOME themes; this suite
 * asserts the 3:1 the Switch depends on in EVERY scope a consumer can select.
 */
describe("the Switch's token pairs clear 3:1 in every theme scope", () => {
  it("covers every named theme", () => {
    const rules = themes.replace(/\/\*[\s\S]*?\*\//g, "");
    const declared = new Set([...rules.matchAll(/\[data-theme="([a-z-]+)"\]/g)].map((m) => m[1]));
    // Hospitality and website take their mode from .dark, so one name covers two scopes.
    const covered = new Set(scopes.map((s) => s.name.replace(/ (light|dark)$/, "")));
    for (const name of declared) {
      expect(covered.has(name), `[data-theme="${name}"] needs a scope here`).toBe(true);
    }
  });

  for (const { name, sources } of scopes) {
    it(name, () => {
      const card = resolve(sources, "hsl-card");
      const canvas = resolve(sources, "hsl-background");
      const accentText = resolve(sources, "accent-text");
      const mutedFg = resolve(sources, "hsl-muted-foreground");

      // On: the accent-text track against the surface, and the card thumb on it.
      expect(contrastRatio(accentText, card), "on track on card / card thumb on track").toBeGreaterThanOrEqual(3);
      expect(contrastRatio(accentText, canvas), "on track on canvas").toBeGreaterThanOrEqual(3);
      // Off: the muted-foreground outline and thumb against the surface.
      expect(contrastRatio(mutedFg, card), "off outline on card").toBeGreaterThanOrEqual(3);
      expect(contrastRatio(mutedFg, canvas), "off outline on canvas").toBeGreaterThanOrEqual(3);
    });
  }
});
