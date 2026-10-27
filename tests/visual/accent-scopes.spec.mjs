import { expect, test } from "playwright/test"

// A data-accent island inside .dark, inside .light and inside a named theme
// resolves the four indigo roles and the ring to its hue's tones, the button,
// focus border and selection follow them, and the planes, body ink and status
// stay those of the boundary around it.

const VIEWPORTS = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } }
const ROLES = { "hsl-primary": "fill", "hsl-ring": "ring", "brand-primary": "mark", "brand-cool": "line", "accent-text": "ink" }
const SPINE = ["hsl-background", "hsl-card", "hsl-foreground", "text-primary", "text-muted", "hsl-border", "surface-success-text", "surface-danger-text"]

async function shot(page, path) {
  try { await page.screenshot({ path, fullPage: true, timeout: 15_000 }) }
  catch (error) { if (error?.name !== "TimeoutError") throw error; console.log(`screenshot skipped: ${path}`) }
}

for (const theme of ["dark", "light"]) {
  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    test(`accent scopes, ${theme} ${viewport}`, async ({ page }) => {
      const errors = []
      page.on("pageerror", (error) => errors.push(error.message))
      await page.setViewportSize(size)
      await page.emulateMedia({ colorScheme: theme })
      await page.goto(`/iframe.html?id=brand-accent-scopes--all-hues&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" })
      await page.locator("[data-accent]").first().waitFor({ state: "visible", timeout: 30_000 })
      const islands = await page.evaluate(({ roles, spine }) => {
        const read = (el, token) => getComputedStyle(el).getPropertyValue(`--${token}`).trim()
        return [...document.querySelectorAll("[data-accent]")].map((el) => {
          const hue = el.dataset.accent
          const parent = el.parentElement
          const button = getComputedStyle(el.querySelector("button"))
          return {
            hue,
            where: el.dataset.theme ?? el.closest("[data-mode]")?.dataset.mode,
            scheme: getComputedStyle(el).colorScheme,
            roles: Object.fromEntries(Object.keys(roles).map((t) => [t, read(el, t)])),
            tones: Object.fromEntries(Object.entries(roles).map(([t, role]) => [t, read(el, `tone-${hue}-${role}`)])),
            spine: Object.fromEntries(spine.map((t) => [t, [read(el, t), read(parent, t)]])),
            focus: [read(el, "focus-border"), read(parent, "focus-border")],
            button: { bg: button.backgroundColor, ink: button.color },
            fillProbe: (() => { const i = document.createElement("i"); i.style.color = `hsl(${read(el, "tone-" + hue + "-fill")})`; el.append(i); const c = getComputedStyle(i).color; i.remove(); return c })(),
          }
        })
      }, { roles: ROLES, spine: SPINE })
      expect(islands.map((i) => `${i.hue}@${i.where}`)).toEqual([
        ...["dark", "light"].flatMap((m) => ["violet", "orange", "teal", "blue", "pink", "brown", "cyan", "lime"].map((h) => `${h}@${m}`)),
        "pink@aubergine", "teal@super-light",
      ])
      for (const island of islands) {
        const at = `${island.hue}@${island.where}`
        expect(island.roles, `${at}: the five roles are the hue's tones`).toEqual(island.tones)
        for (const [token, [inside, outside]] of Object.entries(island.spine)) {
          if (island.where === "dark" || island.where === "light") expect(inside, `${at}: --${token} is the boundary's`).toBe(outside)
        }
        expect(island.focus[0], `${at}: the focus border follows the ring`).not.toBe(island.focus[1])
        expect(island.button.bg, `${at}: the button is the hue's fill`).toBe(island.fillProbe)
        expect(island.button.ink, `${at}: the fill carries white`).toBe("rgb(255, 255, 255)")
        if (island.where === "dark" || island.where === "light") expect(island.scheme).toBe(island.where)
      }
      await shot(page, `test-results/accent-scopes/all-hues-${theme}-${viewport}.png`)
      expect(errors).toEqual([])
    })
  }
}
