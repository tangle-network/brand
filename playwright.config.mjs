import { defineConfig, devices } from "playwright/test"

// Serve the static Storybook build on its own port and never reuse a running
// server: a dev server or another checkout's build would render a different tree.
const storybookPort = Number(process.env.STORYBOOK_PORT ?? 6107)

export default defineConfig({
  testDir: "./tests/visual",
  forbidOnly: true,
  reporter: process.env.CI ? "dot" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${storybookPort}`,
    deviceScaleFactor: 1,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `python3 -m http.server ${storybookPort} --bind 127.0.0.1 --directory storybook-static`,
    url: `http://127.0.0.1:${storybookPort}/index.json`,
    reuseExistingServer: false,
    stderr: "ignore",
    timeout: 120_000,
  },
})
