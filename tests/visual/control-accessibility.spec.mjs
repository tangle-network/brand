import { expect, test } from "playwright/test"

const coverName = "cover-image-with-a-long-filename-for-project-review.png"
const fineHeights = { default: 36, sm: 32, md: 36, lg: 44, compact: 36, touch: 44 }
const iconHeights = { "icon-sm": 32, icon: 36, "icon-lg": 44 }
const rect = (locator) => locator.evaluate((node) => {
  const { width, height } = node.getBoundingClientRect()
  return { width, height }
})

async function openStory(page, id, theme) {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.locator("#storybook-root").waitFor()
  await page.evaluate(() => document.fonts.ready)
  return errors
}

for (const theme of ["light", "dark"]) {
  for (const coarse of [false, true]) {
    test.describe(`${theme}, ${coarse ? "coarse" : "fine"} pointer`, () => {
      test.use({ viewport: { width: coarse ? 390 : 1280, height: 844 }, hasTouch: coarse, isMobile: coarse, colorScheme: theme, reducedMotion: "reduce" })

      test("the control scale keeps desktop geometry and a 44px touch floor", async ({ page }, testInfo) => {
        const errors = await openStory(page, "primitives-control-presentation--presentation", theme)
        expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(coarse)
        for (const [size, fineHeight] of Object.entries(fineHeights)) {
          const row = page.locator(`[data-size-row="${size}"]`)
          const expected = coarse ? Math.max(44, fineHeight) : fineHeight
          for (const control of [row.getByRole("textbox", { name: `${size} field`, exact: true }), row.getByRole("combobox"), row.getByRole("button", { name: "Save", exact: true }), row.getByRole("button", { name: "Cancel", exact: true })]) {
            await expect(control).toBeVisible()
            expect((await rect(control)).height, `${size} height`).toBe(expected)
          }
          if (coarse) {
            expect((await rect(row.getByRole("button", { name: `${size} short action`, exact: true }))).width, "short labels still have a 44px target").toBeGreaterThanOrEqual(44)
            for (const field of [row.getByRole("textbox", { name: `${size} field`, exact: true }), row.getByRole("combobox")]) {
              expect(await field.evaluate((node) => getComputedStyle(node).fontSize)).toBe("16px")
            }
          }
        }
        for (const [size, fineHeight] of Object.entries(iconHeights)) {
          const button = page.getByRole("button", { name: `${size} action`, exact: true })
          const expected = coarse ? Math.max(44, fineHeight) : fineHeight
          expect(await rect(button), `${size} remains square`).toEqual({ width: expected, height: expected })
        }
        for (const control of [page.getByRole("textbox", { name: "Dense field", exact: true }), page.getByRole("combobox", { name: "Dense choice", exact: true }), page.getByRole("button", { name: "Dense action", exact: true })]) {
          expect((await rect(control)).height, "density cannot defeat the touch floor").toBe(coarse ? 44 : 32)
        }
        // The same behavior survives nested light, dark and named theme scopes.
        for (const label of ["Light island", "Dark island", "Named island"]) {
          expect((await rect(page.getByRole("textbox", { name: label }))).height).toBe(coarse ? 44 : 36)
        }
        const choice = page.locator('[data-size-row="md"]').getByRole("combobox")
        if (coarse) await choice.tap()
        else { await choice.focus(); await page.keyboard.press("Enter") }
        await page.getByRole("option", { name: "Second account with a descriptive long name" }).click()
        await expect(choice).toContainText("Second account")
        await expect(choice).toBeFocused()
        await page.locator('[data-size-row="md"]').getByRole("button", { name: "Save", exact: true }).click()
        await expect(page.locator("[data-action-count]")).toHaveText("1")
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
        expect(errors).toEqual([])
        await page.screenshot({ path: testInfo.outputPath("controls.png"), fullPage: true })
      })

      test("upload actions have file-specific names, shared focus and repeatable recovery", async ({ page }, testInfo) => {
        const errors = await openStory(page, "primitives-uploadprogress--recovery", theme)
        const retry = page.getByRole("button", { name: `Retry ${coverName}`, exact: true })
        const removeCover = page.getByRole("button", { name: `Remove ${coverName}`, exact: true })
        const removeComplete = page.getByRole("button", { name: "Remove config.json", exact: true })
        for (const action of [retry, removeCover, removeComplete]) {
          await expect(action).toBeVisible()
          await expect(action).toHaveAttribute("type", "button")
          const expected = coarse ? 44 : 32
          expect(await rect(action)).toEqual({ width: expected, height: expected })
        }
        // Native keyboard focus must be visible, including in forced-colors mode
        // where the shared outline remains after box shadows are removed.
        await page.keyboard.press("Tab")
        await expect(retry).toBeFocused()
        const focus = await retry.evaluate((node) => {
          const css = getComputedStyle(node)
          return { visible: node.matches(":focus-visible"), outline: css.outlineWidth, outlineStyle: css.outlineStyle, shadow: css.boxShadow }
        })
        expect(focus.visible).toBe(true)
        expect(focus.outline).toBe("1px")
        expect(focus.outlineStyle).toBe("solid")
        expect(focus.shadow).not.toBe("none")
        await page.screenshot({ path: testInfo.outputPath("upload-focus.png") })
        await page.emulateMedia({ forcedColors: "active" })
        expect(await retry.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid")
        await page.emulateMedia({ forcedColors: "none" })
        await page.keyboard.press("Enter")
        await expect(retry).toHaveCount(0)
        await expect(page.getByLabel("Retry count")).toHaveText("1")
        await expect(removeCover).toBeVisible()
        await expect(removeComplete).toBeVisible()
        await page.getByRole("button", { name: "Simulate another failure" }).click()
        await expect(retry).toBeVisible()
        if (coarse) await retry.tap()
        else { await retry.focus(); await page.keyboard.press("Space") }
        await expect(retry).toHaveCount(0)
        await expect(page.getByLabel("Retry count")).toHaveText("2")
        if (coarse) await removeCover.tap()
        else { await removeCover.focus(); await page.keyboard.press("Enter") }
        await expect(removeCover).toHaveCount(0)
        await expect(page.getByText(coverName, { exact: true })).toHaveCount(0)
        await expect(removeComplete).toBeVisible()
        await removeComplete.click()
        await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0)
        await expect(page.getByLabel("Form submissions")).toHaveText("0")
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
        await page.goto(`/iframe.html?id=primitives-uploadprogress--error-no-retry&viewMode=story&globals=theme:${theme}`)
        await expect(page.getByRole("button", { name: "Remove too-large.zip", exact: true })).toBeVisible()
        await expect(page.getByRole("button", { name: /^Retry / })).toHaveCount(0)
        await page.goto(`/iframe.html?id=primitives-uploadprogress--no-actions&viewMode=story&globals=theme:${theme}`)
        await expect(page.getByText("config.json", { exact: true })).toBeVisible()
        await expect(page.getByRole("button")).toHaveCount(0)
        expect(errors).toEqual([])
      })
    })
  }
}
