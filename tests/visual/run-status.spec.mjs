import { expect, test } from "playwright/test"

// The run module draws every state through statusMeta, on Brand's roles: a
// running glyph breathes on the page's one loop period, also under reduced
// motion, and nothing spins; Failed and Done take their status inks; every
// shadow is the mode's one shadow colour, so dark mode has no light halo.

const VIEWPORTS = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } }
const STORIES = ["run-rungroup--streaming", "run-rungroup--complete-debugging-run", "run-runphaselist--phases"]

// Screenshots are evidence, not assertions: cap them so a stalled frame never decides the verdict.
async function shot(page, path) {
  try { await page.screenshot({ path, timeout: 15_000 }) }
  catch (error) { if (error?.name !== "TimeoutError") throw error; console.log(`screenshot skipped: ${path}`) }
}

for (const theme of ["dark", "light"]) {
  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    test(`run status glyphs and brand roles, ${theme} ${viewport}`, async ({ page }) => {
      const errors = []
      page.on("pageerror", (error) => errors.push(error.message))
      await page.setViewportSize(size)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      const seen = new Set()
      for (const id of STORIES) {
        await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" })
        await page.locator("[data-run-status]").first().waitFor({ state: "attached", timeout: 30_000 }).catch(async () => {
          const root = await page.locator("#storybook-root, body").first().innerText().catch(() => "")
          throw new Error(`${id}: no status glyph; errors ${JSON.stringify(errors)}; page: ${root.slice(0, 400)}`)
        })
        const facts = await page.evaluate(() => {
          const probe = (value) => {
            const el = document.createElement("i")
            el.style.color = value
            document.body.append(el)
            const out = getComputedStyle(el).color
            el.remove()
            return out
          }
          const shadow = (token) => {
            const el = document.createElement("i")
            el.style.boxShadow = `var(${token})`
            document.body.append(el)
            const out = getComputedStyle(el).boxShadow
            el.remove()
            return out
          }
          return {
            spinners: document.querySelectorAll("#storybook-root .animate-spin").length,
            glyphs: [...document.querySelectorAll("[data-run-status]")].map((el) => {
              const s = getComputedStyle(el)
              return { status: el.dataset.runStatus, color: s.color, animation: s.animationName, duration: s.animationDuration }
            }),
            inks: { failed: probe("var(--surface-danger-text)"), done: probe("var(--surface-success-text)"), running: probe("var(--surface-info-text)") },
            overlay: shadow("--shadow-overlay"),
            card: shadow("--shadow-card"),
            radii: ["--radius-tag", "--radius-control", "--radius-card", "--radius-container"].map((t) => getComputedStyle(document.documentElement).getPropertyValue(t).trim()),
          }
        })
        expect(facts.spinners, `${id}: no spinner`).toBe(0)
        for (const glyph of facts.glyphs) {
          seen.add(glyph.status)
          if (glyph.status in facts.inks) expect(glyph.color, `${id}: ${glyph.status} ink`).toBe(facts.inks[glyph.status])
          if (glyph.status === "running") {
            expect(glyph.animation, `${id}: running breathes`).toBe("tangle-breathe")
            expect(glyph.duration, `${id}: one loop period, kept under reduced motion`).toBe("2s")
          } else {
            expect(glyph.animation, `${id}: a settled glyph is still`).toBe("none")
          }
        }
        // One shadow colour: black in dark, rgb(12 18 29) (220 40% 8%) in light; never the light ink.
        const colour = theme === "dark" ? /rgba\(0, 0, 0, / : /rgba\(12, 18, 29, /
        for (const value of [facts.overlay, facts.card]) {
          expect(value, `${id}: shadow colour`).toMatch(colour)
          expect(value, `${id}: no light halo`).not.toMatch(/rgba\((2[0-5]\d), \1, \1/)
        }
        expect(facts.radii).toEqual(["4px", "8px", "12px", "16px"])
        await shot(page, `test-results/run-status/${id}-${theme}-${viewport}.png`)
      }
      expect([...seen].sort()).toEqual(["done", "failed", "running"])
      expect(errors).toEqual([])
    })
  }
}
