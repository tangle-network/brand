import { expect, test } from "playwright/test"

const ring = (locator) => locator.evaluate((node) => node === document.activeElement && node.matches(":focus-visible"))

test("a pointer choice returns focus to the trigger without the keyboard ring; a keyboard choice keeps it", async ({ page }, testInfo) => {
  await page.goto("/iframe.html?id=primitives-dropdownmenu--default&viewMode=story&globals=theme:dark")
  const trigger = page.getByRole("button", { name: "Options" })
  await expect(page.getByRole("menu")).toBeVisible()

  await page.getByRole("menuitem", { name: /Open terminal/ }).click()
  await expect(page.getByRole("menu")).toHaveCount(0)
  await expect(trigger).toBeFocused()
  expect(await ring(trigger), "mouse: focused, no ring").toBe(false)
  await page.screenshot({ path: testInfo.outputPath("after-pointer.png") })

  await page.keyboard.press("Enter")
  await expect(page.getByRole("menu")).toBeVisible()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("menu")).toHaveCount(0)
  await expect(trigger).toBeFocused()
  expect(await ring(trigger), "keyboard: focused with the ring").toBe(true)
})
