import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  blockIn,
  compositeOver,
  contrastRatio,
  hexRelativeLuminanceIn,
  hslIn,
  hslToRgb,
} from "./css-test-utils";

/**
 * The canonical spine's structural contract.
 *
 * The whole point of this palette is that a surface separates from the one below
 * it by its own FILL. A flat, desaturated ladder pushes that job onto borders,
 * and the app reads grey and washed out — which is the state this replaced. The
 * numbers are therefore not decoration; they are the contract. These assertions
 * pin the PROPERTIES rather than the exact values, so a retune stays free but a
 * collapse back to flat does not.
 */
const tokens = readFileSync(
  path.resolve(import.meta.dirname, "tokens.css"),
  "utf8",
);

// Each spine is declared on a multi-selector header
// (`:root, [data-sandbox-ui], [data-theme="dark"], .dark {`), so anchor on the
// LAST selector — the one the opening brace actually follows.
const DARK = blockIn(tokens, ".dark");
const LIGHT = blockIn(tokens, ".light");

describe("canonical dark spine", () => {
  it("keeps the canvas in the brand's hue family, at any strength", () => {
    const bg = hslIn(DARK, "hsl-background");
    // HUE is the brand constraint and does not move: the greys are cool and sit
    // in the indigo band, so they belong to the same family as the accent rather
    // than reading as a foreign neutral pasted underneath it.
    expect(bg.h, "canvas hue sits in the indigo band").toBeGreaterThanOrEqual(
      215,
    );
    expect(bg.h).toBeLessThanOrEqual(260);
    // SATURATION is a taste dial, not a contract. How far the surfaces lean —
    // near-neutral graphite with the indigo purely in the accents, or a fully
    // indigo-cast ground — is a live product decision, so the only thing pinned
    // here is that the canvas is not dead grey. Asserting a band instead makes
    // this test fail every time that decision is revisited, which tells you
    // nothing about whether the palette is correct.
    expect(bg.s, "a colourless canvas has left the brand behind").toBeGreaterThan(
      5,
    );
  });

  it("guards reading comfort at the INK, not at the canvas", () => {
    // A deep canvas is fine — glare comes from the ratio between ink and ground,
    // not from the ground alone. So the floor here is loose, and the real guard
    // is the 16:1 comfort ceiling on body text in contrast.test.ts. Pinning the
    // canvas instead would forbid a deep spine that is perfectly comfortable
    // once its ink is tuned.
    const bg = hslIn(DARK, "hsl-background");
    expect(bg.l, "an unlit canvas still needs to be a surface").toBeGreaterThan(
      3,
    );
  });

  it("lifts the card off the canvas by fill, not by border", () => {
    const canvas = hslIn(DARK, "hsl-background");
    const card = hslIn(DARK, "hsl-card");
    expect(card.l, "the card must be lighter than the canvas").toBeGreaterThan(
      canvas.l,
    );
    expect(
      card.l - canvas.l,
      "a <3% step is the flat ladder that forces separation onto borders",
    ).toBeGreaterThanOrEqual(3);
  });

  it("defines the accent-TEXT token a named theme is forbidden from recoloring", () => {
    // named-themes.test.ts asserts no named theme overrides --accent-text. That
    // assertion is only meaningful if the base spine actually defines it.
    expect(DARK).toContain("--accent-text:");
    expect(LIGHT).toContain("--accent-text:");
  });

  it("steps canvas -> card -> nested -> overlay monotonically upward", () => {
    const ladder = [
      "md3-surface",
      "md3-surface-container",
      "md3-surface-container-high",
      "md3-surface-container-highest",
    ].map((t) => hexRelativeLuminanceIn(DARK, t));
    for (let i = 1; i < ladder.length; i++) {
      expect(
        ladder[i],
        `elevation step ${i} must be lighter than the plane below it`,
      ).toBeGreaterThan(ladder[i - 1]);
    }
  });
});

describe("muted text stays legible at the opacities the UI actually uses", () => {
  // The token is never rendered at full strength in the places that matter: the
  // shared components fade captions with `/70` and `/60`, and a translucent
  // foreground does not render the token's color — it renders the token composited
  // over whatever is behind it. So the contrast that counts is the composited one,
  // and asserting it here is the difference between a claim and a guarantee.
  const CARD = hslToRgb(hslIn(DARK, "hsl-card"));
  const MUTED = hslToRgb(hslIn(DARK, "hsl-muted-foreground"));

  it("clears AA for normal text at full strength", () => {
    expect(contrastRatio(MUTED, CARD)).toBeGreaterThanOrEqual(4.5);
  });

  for (const alpha of [0.7, 0.6]) {
    it(`clears the 3:1 large-text floor at /${alpha * 100}`, () => {
      const faded = compositeOver(MUTED, CARD, alpha);
      expect(contrastRatio(faded, CARD)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("the sidebar is its own plane", () => {
  // Which SIDE of the canvas the nav sits on is a taste call — it is chrome
  // below the content in dark and paper above it in light, and either reads
  // fine. What is not a taste call is the two collapsing onto the same value:
  // the nav would stop being a distinct region and the page would lose the edge
  // that separates navigation from content, with no border to fall back on.
  // Pinned as a minimum separation so a retune can move it without erasing it.
  for (const [theme, spine] of [
    ["dark", DARK],
    ["light", LIGHT],
  ] as const) {
    it(`${theme}: sidebar and canvas stay separable`, () => {
      const sidebar = hslIn(spine, "sidebar-background");
      const canvas = hslIn(spine, "hsl-background");
      expect(
        Math.abs(sidebar.l - canvas.l),
        "sidebar and canvas lightness must not converge",
      ).toBeGreaterThanOrEqual(2);
    });
  }
});

describe("a hex quoted beside an HSL token is the value that token resolves to", () => {
  // The spine is authored in HSL, but it is READ in hex — every comment here
  // annotates a triple with the colour it produces, because `238 20% 22%` tells
  // a reader nothing. That makes the annotations load-bearing documentation, and
  // load-bearing documentation that nothing checks is documentation that lies:
  // retuning a triple leaves the old hex sitting beside it, and the next person
  // to trust it picks a neighbouring value against a surface that moved.
  //
  // Every declaration of the form `--token: H S% L%; /* … #rrggbb … */`, in every
  // block, not just the two spines.
  const ANNOTATED =
    /^[^\S\n]*(--[a-z0-9-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%;[^\S\n]*\/\*([^*]*)\*\//gm;

  const annotated = [...tokens.matchAll(ANNOTATED)].flatMap(
    ([, token, h, s, l, comment]) =>
      (comment.match(/#[0-9a-fA-F]{6}/g) ?? []).map((quoted: string) => ({
        token,
        quoted,
        hsl: { h: Number(h), s: Number(s), l: Number(l) },
      })),
  );

  it("finds the annotations to check", () => {
    // Without this, rewriting a comment into a shape the pattern misses would
    // empty the suite below and read as a pass.
    expect(annotated.length).toBeGreaterThanOrEqual(15);
  });

  for (const { token, quoted, hsl } of annotated) {
    it(`${token} resolves to ${quoted}`, () => {
      const actual = `#${hslToRgb(hsl)
        .map((c) => Math.round(c).toString(16).padStart(2, "0"))
        .join("")}`;
      expect(actual).toBe(quoted.toLowerCase());
    });
  }
});

describe("the faint ink tiers are still TEXT, on every plane they land on", () => {
  // These two tiers are the ones that break. They are solved against a specific
  // surface, so any move in the ladder — lifting the card, softening the canvas,
  // recasting the hue — silently drops them under the floor, and nothing about
  // the result LOOKS wrong: it renders as slightly faint captions that happen to
  // be unreadable.
  //
  // EVERY plane, not just the two each tier was tuned on. This used to assert
  // the canvas and the card only, while claiming the whole ladder in its name,
  // and the gap was not hypothetical: the overlay plane sat two steps above the
  // card, which put `--text-dim` at 3.30:1 and `--text-muted` at 4.10:1 there —
  // both under the floor, on a plane that carries a modal, a drawer, a w-80
  // dashboard panel and four dropdown menus.
  //
  // Compared hex-to-hex through the MD3 ladder rather than the HSL bridge,
  // because these tokens ARE hexes, and the ladder names each plane at the same
  // position in both themes.
  const ratioOf = (a: number, b: number) =>
    (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

  /** Every plane the spine paints resting content on, floor to overlay. */
  const PLANES = [
    ["canvas", "md3-surface"],
    ["chrome / field well", "md3-surface-container-low"],
    ["card", "md3-surface-container"],
    ["nested / hover", "md3-surface-container-high"],
    ["overlay", "md3-surface-container-highest"],
  ] as const;

  for (const [theme, spine] of [
    ["dark", DARK],
    ["light", LIGHT],
  ] as const) {
    for (const tier of ["text-dim", "text-muted"] as const) {
      it(`${theme}: --${tier} clears 4.5:1 on every plane in the ladder`, () => {
        expect(spine, `--${tier} must be defined`).toContain(`--${tier}:`);
        const ink = hexRelativeLuminanceIn(spine, tier);
        for (const [plane, token] of PLANES) {
          expect(
            ratioOf(ink, hexRelativeLuminanceIn(spine, token)),
            `--${tier} on the ${plane} (--${token})`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it("keeps a real STEP between the ink tiers, not merely an order", () => {
    // A tier that has to clear AA on a lighter plane can always be brightened
    // until it does — but once it sits within a hair of the tier above it, the
    // rung has been deleted rather than repaired, and both an ordering check
    // and a pure contrast check call that a pass.
    //
    // 1.2:1 is the floor because that is roughly where two greys on the same
    // surface stop being separable side by side. The ramp is solved to it, so a
    // retune that compresses one end reds here instead of quietly flattening.
    const MIN_TIER_STEP = 1.2;
    const ratioOf = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    for (const [theme, spine] of [
      ["dark", DARK],
      ["light", LIGHT],
    ] as const) {
      const tiers = ["text-dim", "text-muted", "text-secondary", "text-primary"];
      const lums = tiers.map((t) => hexRelativeLuminanceIn(spine, t));
      for (let i = 1; i < tiers.length; i++) {
        expect(
          ratioOf(lums[i], lums[i - 1]),
          `${theme}: --${tiers[i - 1]} and --${tiers[i]} are too close to read as different tiers`,
        ).toBeGreaterThanOrEqual(MIN_TIER_STEP);
      }
      // Monotonic in the direction the theme recedes: dark quiets by darkening,
      // light by lightening.
      const rising = lums.every((l, i) => i === 0 || l > lums[i - 1]);
      const falling = lums.every((l, i) => i === 0 || l < lums[i - 1]);
      expect(
        theme === "dark" ? rising : falling,
        `${theme}: the ink ramp must move in one direction from dim to primary`,
      ).toBe(true);
    }
  });

  it("keeps a status chip a TINT in light and a RAISED FILL in dark", () => {
    // The two themes want opposite things from a chip's fill, and treating them
    // the same is how this got broken once already: a dark-mode rule — "the fill
    // must separate from the card so the chip reads as a plane" — was applied to
    // light, where the card is white, so 1.5:1 from it IS a dark grey. Every
    // contrast floor still passed and every chip turned to mud.
    //
    // Light: the fill stays a WASH near paper and the border does the
    // separating. Dark: the fill is a raised tint that has to lift off the card,
    // because a dark chip with a near-card fill is just coloured text.
    const ratioOf = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const TONES = ["success", "warning", "danger", "info"] as const;

    for (const tone of TONES) {
      const lightFill = ratioOf(
        hexRelativeLuminanceIn(LIGHT, `surface-${tone}-bg`),
        hexRelativeLuminanceIn(LIGHT, "md3-surface-container"),
      );
      expect(
        lightFill,
        `light --surface-${tone}-bg must stay a tint near paper — the border separates the chip, not the fill`,
      ).toBeLessThanOrEqual(1.25);

      const darkFill = ratioOf(
        hexRelativeLuminanceIn(DARK, `surface-${tone}-bg`),
        hexRelativeLuminanceIn(DARK, "md3-surface-container"),
      );
      expect(
        darkFill,
        `dark --surface-${tone}-bg must lift off the card, or the chip is only coloured text`,
      ).toBeGreaterThanOrEqual(1.3);
    }
  });

  it("keeps the run-mix ramp countable without colour", () => {
    // The bar is 6px tall and told by hue alone, so its slices must separate in
    // GREYSCALE too. Spacing them evenly by OKLCH lightness does not do it —
    // that is perceptual, while the ratio is computed from relative luminance —
    // so the ramp is solved in luminance space and pinned here.
    const RAMP = [
      "run-mix-succeeded",
      "run-mix-waiting",
      "run-mix-failed",
      "run-mix-in-flight",
      "run-mix-cancelled",
    ] as const;
    const ratioOf = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    // The bar's track is `bg-background-tertiary` -> `--muted`, which is an HSL
    // bridge token. `--md3-surface-container-high` is the same plane expressed
    // as a hex, which is what this helper can read.
    for (const [theme, spine, track] of [
      ["dark", DARK, "md3-surface-container-high"],
      ["light", LIGHT, "md3-surface-container-high"],
    ] as const) {
      const lums = RAMP.map((t) => hexRelativeLuminanceIn(spine, t));
      const trackLum = hexRelativeLuminanceIn(spine, track);
      for (const [i, l] of lums.entries()) {
        expect(
          ratioOf(l, trackLum),
          `${theme}: --${RAMP[i]} against the bar's track`,
        ).toBeGreaterThanOrEqual(2.9);
      }
      for (let i = 1; i < lums.length; i++) {
        expect(
          ratioOf(lums[i], lums[i - 1]),
          `${theme}: --${RAMP[i - 1]} and --${RAMP[i]} are indistinguishable in greyscale`,
        ).toBeGreaterThanOrEqual(1.18);
      }
    }
  });

  it("keeps every status TEXT legible on the bare page canvas", () => {
    // Each status text token is solved against its own paired background, and
    // that pairing is what `StatusPill` guarantees. But the tokens also get used
    // as bare text — a "required" hint, a warning headline — where the plane
    // behind them is the page itself. The warning tone measured 4.16:1 there
    // while its three siblings cleared it, so the set was inconsistent rather
    // than deliberately scoped. All four are held to the canvas now.
    const ratioOf = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    for (const [theme, spine] of [
      ["dark", DARK],
      ["light", LIGHT],
    ] as const) {
      const canvas = hexRelativeLuminanceIn(spine, "md3-surface");
      for (const tone of ["success", "warning", "danger", "info"] as const) {
        expect(
          ratioOf(hexRelativeLuminanceIn(spine, `surface-${tone}-text`), canvas),
          `${theme}: --surface-${tone}-text on the page canvas`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("input tokens carry two DIFFERENT roles and must not be conflated", () => {
  // `--input` is shadcn's input BORDER and the Switch off-track: a mid-tone that
  // must stay visible AGAINST a surface. `--hsl-input` / `--bg-input` are the
  // recessed field FILL. Pointing `--input` at the fill is a tempting-looking
  // "fix" that makes every input border and every off-state switch track vanish
  // into the plane behind it — a legibility bug with no error and no visual clue
  // beyond "the toggle disappeared". Pinned so it can't happen quietly.
  it("--input is the border/track token, not the field fill", () => {
    // The shadcn alias layer is declared ONCE and re-resolves per theme through
    // the --hsl-* spine, so this is asserted on the file rather than per scope.
    expect(tokens).toMatch(/--input:\s*var\(--hsl-muted-foreground\)/);
    expect(
      tokens,
      "--input must not resolve to the field well — input borders and off-state switch tracks would disappear into the plane behind them",
    ).not.toMatch(/--input:\s*var\(--hsl-input\)/);
  });

  for (const [name, spine] of [
    ["dark", DARK],
    ["light", LIGHT],
  ] as const) {
    it(`${name}: the field fill is single-sourced from --hsl-input`, () => {
      expect(spine).toMatch(/--bg-input:\s*hsl\(var\(--hsl-input\)\)/);
    });
  }
});

describe("canonical light spine", () => {
  it("is white paper on a tinted canvas, never white-on-white", () => {
    const canvas = hslIn(LIGHT, "hsl-background");
    const card = hslIn(LIGHT, "hsl-card");
    expect(card.l, "the card is paper").toBe(100);
    expect(
      canvas.l,
      "a pure-white canvas gives a white card nothing to lift off",
    ).toBeLessThan(97);
    // Mirrors the dark spine exactly: HUE is the brand constraint and is pinned;
    // saturation is a taste dial and is not. How far the surfaces lean is a live
    // product decision, so asserting a band here only guarantees this test fails
    // the next time that decision is revisited.
    expect(canvas.h, "canvas hue sits in the indigo band").toBeGreaterThanOrEqual(
      215,
    );
    expect(canvas.h).toBeLessThanOrEqual(260);
    expect(canvas.s, "a colourless canvas has left the brand behind").toBeGreaterThan(
      5,
    );
  });

  it("ALTERNATES paper and well — light elevation is not a darkening ramp", () => {
    // Deliberately not monotonic. On a tinted canvas a raised plane is paper and
    // a recessed one is a tinted well, so the ladder alternates. Pinning it stops
    // a well-meaning "fix" from forcing a strictly-ordered ramp, which is exactly
    // what produced the white-on-white flatness this palette replaced.
    const paper = ["md3-surface-container", "md3-surface-container-highest"];
    const wells = ["md3-surface-container-low", "md3-surface-container-high"];
    const canvas = hexRelativeLuminanceIn(LIGHT, "md3-surface");

    for (const t of paper) {
      expect(hexRelativeLuminanceIn(LIGHT, t), `${t} is paper`).toBe(1);
    }
    for (const t of wells) {
      const l = hexRelativeLuminanceIn(LIGHT, t);
      expect(l, `${t} is a well — below paper`).toBeLessThan(1);
      expect(l, `${t} still sits above the canvas`).toBeGreaterThan(canvas);
    }
  });

  it("lets the overlay share the card's fill — it lifts by shadow, not lightness", () => {
    // `--bg-card` (depth-2) and `--bg-elevated` (depth-4) are both paper by design;
    // the semantic layer agrees (--hsl-card and --hsl-popover are both white). The
    // separation is the shadow, so a shadow token must exist to carry it.
    expect(hexRelativeLuminanceIn(LIGHT, "depth-2")).toBe(1);
    expect(hexRelativeLuminanceIn(LIGHT, "depth-4")).toBe(1);
    expect(LIGHT, "the overlay's separation depends on this").toMatch(
      /--shadow-dropdown:/,
    );
  });

  it("keeps the light canvas single-sourced — --depth-1 and --md3-surface agree", () => {
    // Both are the L0 page canvas. Two hex literals for one plane is a divergence
    // waiting to happen the next time one of them is retuned.
    const canvasHex = (token: string) =>
      LIGHT.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
    expect(canvasHex("depth-1")).toBe(canvasHex("md3-surface"));
  });

  it("keeps the derived --bg-* surfaces on the ladder", () => {
    // Hardcoded hex here is how `bg-card` (→ --hsl-card) and `var(--bg-card)`
    // drifted into disagreeing about what a card is.
    for (const token of ["bg-dark", "bg-card", "bg-elevated", "bg-section"]) {
      expect(LIGHT, `--${token} must derive from the ladder`).toMatch(
        new RegExp(`--${token}:\\s*var\\(--depth-`),
      );
    }
  });
});
