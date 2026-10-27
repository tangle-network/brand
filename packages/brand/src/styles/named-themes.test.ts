import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  blockIn,
  blocksIn,
  compositeOver,
  contrastRatio,
  declIn,
  hexIn,
  hexRelativeLuminanceIn,
  hslIn,
  hslToRgb,
  resolveIn,
} from "./css-test-utils";

/**
 * The named-theme contract.
 *
 * A named theme re-skins the surface ladder and may carry a product accent
 * (primary / ring / accent-text), as Arena, Aubergine and Super do. It never
 * changes what a status or category tone means. Intelligence is surface-only and
 * keeps the Tangle accent. These assertions live here rather than in the
 * consuming app because the palette lives here: an app's job is only to opt in.
 */
const themes = readFileSync(
  path.resolve(import.meta.dirname, "named-themes.css"),
  "utf8",
);
const tokens = readFileSync(
  path.resolve(import.meta.dirname, "tokens.css"),
  "utf8",
);

// The canonical dark spine, anchored on the LAST selector of its multi-selector
// header (`:root, [data-sandbox-ui], [data-theme="dark"], .dark {`) — the same
// trick tokens.test.ts uses.
const CANON = blockIn(tokens, ".dark");
const CANON_LIGHT = blockIn(tokens, ".light");

function block(selector: string): string {
  return blockIn(themes, selector);
}

describe('named theme: .dark[data-theme="intelligence"]', () => {
  const css = block('.dark[data-theme="intelligence"]');

  it("retints the surface canvas to violet", () => {
    for (const token of ["background", "card", "popover", "muted", "border"]) {
      const { h } = hslIn(css, `hsl-${token}`);
      expect(h, `--hsl-${token} hue`).toBeGreaterThanOrEqual(255);
      expect(h, `--hsl-${token} hue`).toBeLessThanOrEqual(268);
    }
  });

  it("reads as graded depth, not mud: lightness rises, saturation tapers, hue locked", () => {
    const ladder = ["hsl-background", "hsl-card", "hsl-secondary"].map((t) =>
      hslIn(css, t),
    );
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].l, `step ${i} lightness must rise`).toBeGreaterThan(
        ladder[i - 1].l,
      );
      expect(
        ladder[i].s,
        `step ${i} saturation must not rise as it lightens`,
      ).toBeLessThanOrEqual(ladder[i - 1].s);
    }
  });

  it("never recolors the Tangle accent — surfaces carry the identity, not the brand", () => {
    for (const token of ["--hsl-primary", "--hsl-ring", "--accent-text"]) {
      expect(css, `${token} must not be overridden by a named theme`).not.toContain(
        `${token}:`,
      );
    }
  });

  it("is dark-only — the SELECTOR enforces it, not the caller", () => {
    // An unscoped `[data-theme="intelligence"]` would repaint every surface with
    // the violet dark ramp if a consumer left the attribute on while switching to
    // light. The `.dark` requirement makes that impossible.
    //
    // Checked against the RULES, not the raw file: prose in a comment may well
    // spell the selector out, and a doc edit must not be able to fail this.
    const rules = themes.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).toContain('.dark[data-theme="intelligence"]');
    expect(rules).not.toMatch(/(?<!\.dark)\[data-theme="intelligence"\]/);
    // No light variant: light falls through to brand's canonical light spine.
    expect(rules).not.toContain('[data-theme="intelligence-light"]');
  });
});

describe('named theme: [data-theme="tangle-dark"]', () => {
  const css = block('[data-theme="tangle-dark"]');
  // `[data-theme="tangle-light"]` heads two rules — the shared light-status
  // override group AND the theme's own block; the theme block is the one that
  // declares the spine.
  const light = blocksIn(themes, '[data-theme="tangle-light"]').find((b) =>
    b.includes("--hsl-background"),
  );
  if (!light) throw new Error('missing theme block: [data-theme="tangle-light"]');

  it("declares nothing: the attribute names the spine tokens.css seeds on it", () => {
    // tangle-dark exists so the attribute can NAME the default spine (a dark
    // island in a light-named wrapper, a picker's explicit selection). It is
    // the canonical spine by construction: tokens.css declares every dark token
    // on this selector, so a copy here could only drift from it.
    expect(css.replace(/^[^{]*\{/, "").trim()).toBe("");
    for (const token of ["hsl-background", "hsl-destructive", "accent-text", "text-dim"]) {
      expect(resolveIn(css, token), `--${token} resolves to the :root dark spine`).toBe(
        resolveIn(CANON, token),
      );
    }
  });

  it("keeps the Tangle accent in the same indigo family", () => {
    for (const token of ["hsl-primary", "hsl-ring"]) {
      const dark = hslIn(css, token);
      const lite = hslIn(light, token);
      expect(
        Math.abs(dark.h - lite.h),
        `--${token} hue must sit within 10 of tangle-light`,
      ).toBeLessThanOrEqual(10);
    }
  });

  it("elevates by lightening, never darkening", () => {
    const planes = ["depth-1", "depth-2", "depth-3", "depth-4"].map((t) =>
      hexRelativeLuminanceIn(css, t),
    );
    for (let i = 1; i < planes.length; i++) {
      expect(planes[i], `depth step ${i} must be brighter than the one below`).toBeGreaterThan(
        planes[i - 1],
      );
    }
    const ladder = ["hsl-background", "hsl-card", "hsl-popover"].map(
      (t) => hslIn(css, t).l,
    );
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i], `step ${i} lightness must rise`).toBeGreaterThan(
        ladder[i - 1],
      );
    }
  });

  it("holds the dark contrast discipline — AA floors, AAA ink", () => {
    const canvas = hslToRgb(hslIn(css, "hsl-background"));
    const card = hslToRgb(hslIn(css, "hsl-card"));
    const fg = hslToRgb(hslIn(css, "hsl-foreground"));
    expect(contrastRatio(fg, canvas), "ink on canvas").toBeGreaterThanOrEqual(7);
    expect(contrastRatio(fg, card), "ink on card").toBeGreaterThanOrEqual(7);

    const muted = hslToRgb(hslIn(css, "hsl-muted-foreground"));
    expect(contrastRatio(muted, card), "muted ink on card").toBeGreaterThanOrEqual(
      4.5,
    );

    const primary = hslToRgb(hslIn(css, "hsl-primary"));
    const onPrimary = hslToRgb(hslIn(css, "hsl-primary-foreground"));
    expect(
      contrastRatio(onPrimary, primary),
      "the fill indigo carries white",
    ).toBeGreaterThanOrEqual(4.5);

    // The ring is NON-TEXT: it must clear 3:1 against both planes it sits on.
    const ring = hslToRgb(hslIn(css, "hsl-ring"));
    expect(contrastRatio(ring, canvas), "ring on canvas").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(ring, card), "ring on card").toBeGreaterThanOrEqual(3);

    expect(
      contrastRatio(hexIn(css, "accent-text"), card),
      "bright indigo accent text on card",
    ).toBeGreaterThanOrEqual(4.5);

    // The faintest tier is still TEXT: it clears the body floor on both planes.
    const dim = hexIn(css, "text-dim");
    expect(contrastRatio(dim, card), "text-dim on card").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dim, canvas), "text-dim on canvas").toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("is self-sufficient inside a light-named wrapper — the island it exists for", () => {
    // The feature's stated scenario: tangle-dark nested in a tangle-light
    // wrapper. A token the island omitted would inherit the WRAPPER's light
    // value (its near-black secondary-foreground on the dark secondary measured
    // ~1.5:1 once), which is why tokens.css seeds the whole spine on the
    // island's own selector.
    // The island declares every dark token on itself (the baseline tokens.css
    // seeds on its selector), so nothing falls through to the wrapper: the
    // chain is the island's own block over the canonical dark spine.
    const effective = (token: string) => hslIn(css, token);
    for (const [fgToken, bgToken] of [
      ["hsl-secondary-foreground", "hsl-secondary"],
      ["hsl-accent-foreground", "hsl-accent"],
      ["hsl-destructive-foreground", "hsl-destructive"],
    ] as const) {
      expect(
        contrastRatio(hslToRgb(effective(fgToken)), hslToRgb(effective(bgToken))),
        `effective ${fgToken} on ${bgToken}, island inside tangle-light`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the dark-tuned :root status palette instead of redeclaring it", () => {
    // Same contract as aubergine/arena: dark named themes inherit status from the
    // dark spine, so there is exactly one dark status palette to tune. What must
    // be proven is that the inherited pairs pass AA on their dark surfaces.
    expect(css).not.toMatch(/--surface-(success|warning|danger|info)-/);
    for (const name of ["success", "warning", "danger", "info"]) {
      const text = hexIn(CANON, `surface-${name}-text`);
      const bg = hexIn(CANON, `surface-${name}-bg`);
      expect(
        contrastRatio(text, bg),
        `inherited ${name} status text on its dark surface`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("named themes: secondary text tiers are readable text", () => {
  // --text-muted and --text-dim carry hints, subtitles and timestamps. They are
  // still TEXT, so each clears the AA body floor on every plane text renders on
  // (canvas, card, panel, elevated and highest container), and muted stays
  // stronger than dim.
  const scopes = [
    "aubergine",
    "aubergine-light",
    "arena",
    "arena-light",
    "super",
    "super-light",
    "tangle-dark",
    "tangle-light",
  ];
  for (const scope of scopes) {
    it(`[data-theme="${scope}"] holds AA for --text-muted and --text-dim`, () => {
      // The theme block over the spine it inherits; tangle-dark declares nothing
      // and resolves to the canonical dark spine.
      const blocks = blocksIn(themes, `[data-theme="${scope}"]`);
      const css = blocks.find((b) => /--hsl-background:/.test(b)) ?? blocks[0];
      const chain = scope.endsWith("-light") ? [css, CANON_LIGHT] : [css];
      const resolve = (token: string) => hexIn(chain, token);
      const planes = {
        canvas: resolve("bg-root"),
        card: resolve("bg-card"),
        panel: resolve("depth-2"),
        elevated: resolve("depth-4"),
        highest: resolve("md3-surface-container-highest"),
      };
      const muted = resolve("text-muted");
      const dim = resolve("text-dim");
      for (const [plane, rgb] of Object.entries(planes)) {
        expect(contrastRatio(muted, rgb), `text-muted on ${plane}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(dim, rgb), `text-dim on ${plane}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(muted, rgb), `muted outranks dim on ${plane}`).toBeGreaterThan(
          contrastRatio(dim, rgb),
        );
      }
    });
  }
});
for (const [name, mode] of [
  ["agents", "dark"],
  ["agents-light", "light"],
] as const) {
  describe(`named theme: [data-theme="${name}"]`, () => {
    // The generated block, not the shared named-light ink rule that also lists it.
    const css = blocksIn(themes, `[data-theme="${name}"]`).find((b) => b.includes("--hsl-background:")) ?? "";

    it("retints surfaces, text and borders only", () => {
      // The accent, status and category tokens stay canonical, so the theme can
      // never change what the brand colour, a state or a category looks like.
      expect(css).not.toMatch(
        /--(hsl-(primary|ring|destructive|success|warning|info)|sidebar-(primary|ring)|md3-(primary|on-primary|error)|btn-|accent-|brand-|surface-|status-|tone-)[a-z0-9-]*:/,
      );
    });

    it("declares only canonical spine names", () => {
      for (const [, token] of css.matchAll(/--([a-z0-9-]+):/g)) {
        expect(tokens, `--${token} must be a tokens.css token`).toContain(`--${token}:`);
      }
    });

    it("keeps ink readable on every plane", () => {
      for (const plane of ["hsl-background", "hsl-card", "hsl-popover", "hsl-muted"]) {
        const bg = hslToRgb(hslIn(css, plane));
        expect(
          contrastRatio(hslToRgb(hslIn(css, "hsl-foreground")), bg),
          `foreground on ${plane}`,
        ).toBeGreaterThanOrEqual(7);
        expect(
          contrastRatio(hslToRgb(hslIn(css, "hsl-muted-foreground")), bg),
          `muted foreground on ${plane}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    if (mode === "light") {
      it("is a white page whose cards separate by shadow", () => {
        expect(declIn(css, "hsl-background")).toBe("0 0% 100%");
        expect(declIn(css, "hsl-card")).toBe("0 0% 100%");
        expect(declIn(css, "shadow-card")).toMatch(/hsl\(var\(--shadow-color\)/);
      });
    }
  });
}

describe("data-tone scopes", () => {
  it("re-resolve each category alias on every nested mode boundary", () => {
    for (const name of ["violet", "orange", "teal", "blue", "pink", "brown", "cyan", "lime"]) {
      const rule = tokens.match(new RegExp(`\\[data-tone="${name}"\\],\\n\\[data-tone="${name}"\\] :is\\(([^)]*)\\) \\{([^}]*)\\}`));
      expect(rule, `data-tone="${name}" rule`).not.toBeNull();
      for (const boundary of [".light", ".dark", "[data-theme]", "[data-sandbox-ui]", "[data-sandbox-theme]"]) {
        expect(rule![1], `${name} boundary list`).toContain(boundary);
      }
      for (const role of ["bg", "bg-hover", "bg-selected", "border", "border-selected", "text", "icon"]) {
        expect(rule![2]).toContain(`--tone-${role}: var(--tone-${name}-${role});`);
      }
    }
  });
});

describe("named themes: the base surface follows the retint", () => {
  // `bg-surface` (and `--md3-surface-*`/`--md3-on-surface*`) paint page chrome
  // such as a mobile top bar. A retinted scope that leaves them at the neutral
  // spine renders a grey bar on a purple or green page.
  for (const scope of ["aubergine", "aubergine-light", "arena", "arena-light", "super", "super-light"]) {
    it(`[data-theme="${scope}"] retints the base surface tokens`, () => {
      const css = blocksIn(themes, `[data-theme="${scope}"]`).find((b) => /--text-dim:/.test(b));
      for (const token of [
        "md3-surface",
        "md3-surface-dim",
        "md3-surface-bright",
        "md3-surface-variant",
        "md3-on-surface",
        "md3-on-surface-variant",
      ]) {
        expect(css, `${scope} declares --${token}`).toMatch(new RegExp(`--${token}:`));
      }
      expect(css).toMatch(/--md3-surface:\s*var\(--bg-root\)/);
    });
  }
});

describe('named theme: [data-theme="hospitality"]', () => {
  const rules = themes.replace(/\/\*[\s\S]*?\*\//g, "");
  const light = block('[data-theme="hospitality"]:where(:not(.dark))');
  const dark = block('.dark[data-theme="hospitality"]');
  const props = (css: string) =>
    [...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]).sort();

  it("takes its dark mode from the .dark class, never from a second attribute", () => {
    expect(rules).toMatch(/^\[data-theme="hospitality"\]:where\(:not\(\.dark\)\) \{/m);
    expect(rules).toMatch(/^\.dark\[data-theme="hospitality"\] \{/m);
    expect(rules).not.toContain('[data-theme="hospitality-light"]');
    expect(rules).not.toContain('[data-theme="hospitality-dark"]');
  });

  it("starts from a complete canonical baseline in either mode, before hydration too", () => {
    // Without the seed, a classless <html data-theme="hospitality"> would keep
    // the dark-default :root syntax, status and color-scheme under light paper.
    const header = (anchor: string) => {
      const end = tokens.indexOf(anchor);
      return tokens.slice(tokens.lastIndexOf("}", end) + 1, tokens.indexOf("{", end));
    };
    expect(header("color-scheme: dark")).toContain('[data-theme="hospitality"],');
    expect(header("color-scheme: light")).toContain('[data-theme="hospitality"]:where(:not(.dark)),');
  });

  it("lets nothing from the light identity survive into dark", () => {
    // `.dark[data-theme]` outranks `[data-theme]`, but only for what it declares;
    // a property the dark block omits would keep its light value in dark mode.
    expect(props(dark)).toEqual(props(light));
  });

  it("never redefines what a status or category color means", () => {
    // The success/warning/danger/neutral surface triples are retuned for the
    // sage planes (surface-ladder.test.ts holds their hue and contrast), and the
    // dark destructive red is lightened to read on the lighter popover; it stays
    // red. The other status hues, info and every category stay canonical.
    for (const [css, spine] of [
      [light, CANON_LIGHT],
      [dark, CANON],
    ] as const) {
      expect(css).not.toMatch(
        /--(hsl-)?(success|warning|info|error)\b|--destructive|--hsl-destructive-foreground|--surface-info-|--status-|--tone-|--run-mix-|--syntax-/,
      );
      expect(hslIn([css, spine], "hsl-destructive").h, "destructive stays red").toBe(0);
    }
    expect(hslIn(light, "hsl-destructive")).toEqual(hslIn(CANON_LIGHT, "hsl-destructive"));
  });

  it("keeps the canonical ladder roles: paper cards on a tinted canvas in light, rising planes in dark", () => {
    expect(hslIn(light, "hsl-card")).toEqual({ h: 0, s: 0, l: 100 });
    // As in canonical light, the canvas sits BELOW the wells and the paper.
    for (const plane of ["md3-surface-container-low", "md3-surface-container", "md3-surface-container-high"]) {
      expect(hexRelativeLuminanceIn(light, "md3-surface"), `canvas below ${plane}`).toBeLessThan(
        hexRelativeLuminanceIn(light, plane),
      );
    }
    const steps = [
      "md3-surface-container-lowest",
      "md3-surface-container-low",
      "md3-surface-container",
      "md3-surface-container-high",
      "md3-surface-container-highest",
    ].map((token) => hexRelativeLuminanceIn(dark, token));
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i], `dark step ${i} must rise`).toBeGreaterThan(steps[i - 1]);
    }
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ])("holds AA text and 3:1 focus contrast in %s", (_mode, css) => {
    const canvas = hslToRgb(hslIn(css, "hsl-background"));
    const card = hslToRgb(hslIn(css, "hsl-card"));
    const muted = hslToRgb(hslIn(css, "hsl-muted"));
    const fg = hslToRgb(hslIn(css, "hsl-foreground"));
    expect(contrastRatio(fg, canvas), "ink on canvas").toBeGreaterThanOrEqual(7);
    expect(contrastRatio(fg, card), "ink on card").toBeGreaterThanOrEqual(7);
    const mutedInk = hslToRgb(hslIn(css, "hsl-muted-foreground"));
    const planes = [
      ["canvas", canvas],
      ["card", card],
      ["muted", muted],
      ["elevated", hexIn(css, "depth-4")],
      ["highest", hexIn(css, "md3-surface-container-highest")],
    ] as const;
    for (const [name, plane] of planes) {
      expect(contrastRatio(mutedInk, plane), `muted ink on ${name}`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hexIn(css, "accent-text"), plane), `accent text on ${name}`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hexIn(css, "text-dim"), plane), `text-dim on ${name}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      contrastRatio(hslToRgb(hslIn(css, "hsl-primary-foreground")), hslToRgb(hslIn(css, "hsl-primary"))),
      "primary label on the primary fill",
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(hexIn(css, "btn-primary-text"), hexIn(css, "btn-primary-bg")),
      "button label on the button fill",
    ).toBeGreaterThanOrEqual(4.5);
    const ring = hslToRgb(hslIn(css, "hsl-ring"));
    expect(contrastRatio(ring, canvas), "ring on canvas").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(ring, card), "ring on card").toBeGreaterThanOrEqual(3);
  });
});

describe('named theme: [data-theme="super"] / [data-theme="super-light"]', () => {
  const dark = block('[data-theme="super"]');
  const light = blocksIn(themes, '[data-theme="super-light"]').find((b) =>
    b.includes("--hsl-background"),
  );
  if (!light) throw new Error('missing theme block: [data-theme="super-light"]');

  it.each([
    ["super", dark],
    ["super-light", light],
  ])("%s clears AA for ink, muted ink, the action fill and the ring", (_name, css) => {
    const canvas = hslToRgb(hslIn(css, "hsl-background"));
    const card = hslToRgb(hslIn(css, "hsl-card"));
    const muted = hslToRgb(hslIn(css, "hsl-muted"));
    const fg = hslToRgb(hslIn(css, "hsl-foreground"));
    const mutedFg = hslToRgb(hslIn(css, "hsl-muted-foreground"));
    expect(contrastRatio(fg, canvas), "ink on canvas").toBeGreaterThanOrEqual(7);
    expect(contrastRatio(fg, card), "ink on card").toBeGreaterThanOrEqual(7);
    expect(contrastRatio(mutedFg, canvas), "muted ink on canvas").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(mutedFg, card), "muted ink on card").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(mutedFg, muted), "muted ink on muted").toBeGreaterThanOrEqual(4.5);

    const primary = hslToRgb(hslIn(css, "hsl-primary"));
    const onPrimary = hslToRgb(hslIn(css, "hsl-primary-foreground"));
    expect(contrastRatio(onPrimary, primary), "text on the action fill").toBeGreaterThanOrEqual(4.5);

    const ring = hslToRgb(hslIn(css, "hsl-ring"));
    expect(contrastRatio(ring, canvas), "ring on canvas").toBeGreaterThanOrEqual(3);
    expect(contrastRatio(ring, card), "ring on card").toBeGreaterThanOrEqual(3);

    for (const tier of ["text-primary", "text-secondary", "text-muted", "text-dim", "accent-text"]) {
      expect(contrastRatio(hexIn(css, tier), card), `${tier} on card`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(hexIn(css, tier), canvas), `${tier} on canvas`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    ["super", dark],
    ["super-light", light],
  ])("%s button tokens follow the action fill, not the Tangle indigo", (_name, css) => {
    expect(contrastRatio(hexIn(css, "btn-primary-text"), hexIn(css, "btn-primary-bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hexIn(css, "btn-primary-text"), hexIn(css, "btn-primary-hover"))).toBeGreaterThanOrEqual(4.5);
    const fill = hslToRgb(hslIn(css, "hsl-primary"));
    hexIn(css, "btn-primary-bg").forEach((channel, i) => {
      expect(Math.abs(channel - fill[i]), "btn-primary-bg matches --hsl-primary").toBeLessThanOrEqual(4);
    });
  });

  it("keeps the forest action in one hue family across modes", () => {
    for (const token of ["hsl-primary", "hsl-ring"]) {
      expect(
        Math.abs(hslIn(dark, token).h - hslIn(light, token).h),
        `--${token} hue`,
      ).toBeLessThanOrEqual(10);
    }
  });

  it("elevates by lightening in dark", () => {
    const planes = ["depth-1", "depth-2", "depth-3", "depth-4"].map((t) =>
      hexRelativeLuminanceIn(dark, t),
    );
    for (let i = 1; i < planes.length; i++) {
      expect(planes[i], `depth step ${i}`).toBeGreaterThan(planes[i - 1]);
    }
  });

  it("inherits status tones instead of retinting them", () => {
    for (const css of [dark, light]) {
      expect(css).not.toMatch(/--surface-(success|warning|danger|info|neutral)-/);
      expect(css).not.toMatch(/--tone-/);
    }
  });
});

describe('named theme: [data-theme="website"]', () => {
  const rules = themes.replace(/\/\*[\s\S]*?\*\//g, "");
  const light = block('[data-theme="website"]:where(:not(.dark))');
  const dark = block('.dark[data-theme="website"]');
  const props = (css: string) =>
    [...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]).sort();

  it("takes its dark mode from the .dark class, so a light island is the same attribute", () => {
    expect(rules).toMatch(/^\[data-theme="website"\]:where\(:not\(\.dark\)\) \{/m);
    expect(rules).toMatch(/^\.dark\[data-theme="website"\] \{/m);
    expect(rules).not.toContain('[data-theme="website-light"]');
  });

  it("starts from a complete canonical baseline in either mode", () => {
    const header = (anchor: string) => {
      const end = tokens.indexOf(anchor);
      return tokens.slice(tokens.lastIndexOf("}", end) + 1, tokens.indexOf("{", end));
    };
    expect(header("color-scheme: dark")).toContain('[data-theme="website"],');
    expect(header("color-scheme: light")).toContain('[data-theme="website"]:where(:not(.dark)),');
  });

  it("declares the same properties in both modes", () => {
    expect(props(dark)).toEqual(props(light));
  });

  it("changes planes and ink only: accent, status, category and syntax stay canonical", () => {
    for (const css of [light, dark]) {
      expect(css).not.toMatch(
        /--hsl-(primary|ring)|--accent-text|--brand-|--btn-|--(hsl-)?(success|warning|destructive|info|error)\b|--surface-(success|warning|danger|info|neutral)-|--status-|--tone-|--syntax-/,
      );
    }
  });

  it("keeps the canonical ladder roles: paper cards in light, rising planes in dark", () => {
    expect(hslIn(light, "hsl-card")).toEqual({ h: 0, s: 0, l: 100 });
    const steps = [
      "md3-surface-container-lowest",
      "md3-surface-container-low",
      "md3-surface-container",
      "md3-surface-container-high",
      "md3-surface-container-highest",
    ].map((token) => hexRelativeLuminanceIn(dark, token));
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i], `dark step ${i} must rise`).toBeGreaterThan(steps[i - 1]);
    }
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ])("holds AA ink on every plane in %s", (_mode, css) => {
    const fg = hslToRgb(hslIn(css, "hsl-foreground"));
    const mutedInk = hslToRgb(hslIn(css, "hsl-muted-foreground"));
    const planes = [
      ["canvas", hslToRgb(hslIn(css, "hsl-background"))],
      ["card", hslToRgb(hslIn(css, "hsl-card"))],
      ["muted", hslToRgb(hslIn(css, "hsl-muted"))],
      ["popover", hslToRgb(hslIn(css, "hsl-popover"))],
      ["elevated", hexIn(css, "depth-4")],
      ["highest", hexIn(css, "md3-surface-container-highest")],
    ] as const;
    for (const [name, plane] of planes) {
      expect(contrastRatio(fg, plane), `ink on ${name}`).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(mutedInk, plane), `muted ink on ${name}`).toBeGreaterThanOrEqual(4.5);
      for (const token of ["text-secondary", "text-muted", "text-dim"]) {
        expect(contrastRatio(hexIn(css, token), plane), `${token} on ${name}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("dark themes: destructive reads as text", () => {
  // `text-destructive` is the error ink on cards, popovers and wells, and
  // `bg-destructive text-destructive-foreground` is the destructive fill. In
  // dark mode one token must serve both, so it is a light red carrying dark
  // ink, as the dark primary does: 2.5:1 error text on a sage card shipped
  // before every dark scope was checked here.
  const scopes: Array<[string, string]> = [
    [".dark", CANON],
    ...[
      '[data-theme="tangle-dark"]',
      '[data-theme="aubergine"]',
      '[data-theme="arena"]',
      '[data-theme="super"]',
      '.dark[data-theme="intelligence"]',
      '.dark[data-theme="hospitality"]',
      '[data-theme="agents"]',
      '.dark[data-theme="website"]',
    ].map((selector): [string, string] => {
      // A selector can head two rules (tangle-light's shared status group and
      // its theme block); the theme block is the one with a canvas. tangle-dark
      // declares nothing and resolves to the spine it is seeded with.
      const blocks = blocksIn(themes, selector);
      const css = blocks.find((b) => b.includes("--hsl-background")) ?? (blocks.length === 1 ? blocks[0] : undefined);
      if (css === undefined) throw new Error(`missing dark theme block: ${selector}`);
      return [selector, css];
    }),
  ];
  it.each(scopes)("%s holds AA for destructive text and its fill", (_selector, css) => {
    const effective = (token: string) => {
      try {
        return hslToRgb(hslIn(css, token));
      } catch {
        return hslToRgb(hslIn(CANON, token));
      }
    };
    const destructive = effective("hsl-destructive");
    for (const plane of ["hsl-background", "hsl-card", "hsl-popover", "hsl-muted"]) {
      const bg = effective(plane);
      expect(contrastRatio(destructive, bg), `destructive text on ${plane}`).toBeGreaterThanOrEqual(4.5);
      // Error rows commonly sit on a 10% destructive tint (bg-destructive/10).
      const tint = compositeOver(destructive, bg, 0.1);
      expect(contrastRatio(destructive, tint), `destructive text on its tint over ${plane}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      contrastRatio(effective("hsl-destructive-foreground"), destructive),
      "destructive-foreground on the destructive fill",
    ).toBeGreaterThanOrEqual(4.5);
  });
});
