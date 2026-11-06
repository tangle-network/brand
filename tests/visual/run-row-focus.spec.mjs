import { expect, test } from "playwright/test"

// The collapsed RunRowShell trigger must show a keyboard focus indicator the
// user can see: the row clips overflow, so the shared ring draws inside the
// trigger. A computed outline once passed while invisible, so this spec diffs
// the rendered row region — byte-identical at rest twice, different once
// keyboard focus lands — and proves Enter still toggles.

const VIEWPORTS = { desktop: { width: 1280, height: 900 }, phone: { width: 390, height: 844 } }

for (const theme of ["dark", "light"]) {
  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    test(`collapsed run-row trigger shows visible keyboard focus, ${theme} ${viewport}`, async ({ page }) => {
      await page.setViewportSize(size)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      await page.goto(`/iframe.html?id=run-inlinethinkingitem--complete&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" })
      const row = page.locator('[data-run-row][data-state="closed"]').first()
      const trigger = row.locator("button").first()
      await expect(trigger).toBeVisible()
      const rest = await row.screenshot()
      expect((await row.screenshot()).equals(rest), "story is static at rest").toBe(true)
      await page.keyboard.press("Tab")
      expect(
        await page.evaluate((node) => document.activeElement === node, await trigger.elementHandle()),
        "Tab reaches the collapsed trigger",
      ).toBe(true)
      expect(!(await row.screenshot()).equals(rest), "keyboard focus visibly changes the row").toBe(true)
      await page.keyboard.press("Enter")
      await expect(row).toHaveAttribute("data-state", "open")
      await page.keyboard.press("Enter")
      await expect(row).toHaveAttribute("data-state", "closed")
    })
  }
}
