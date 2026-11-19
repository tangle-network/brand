import type { Meta, StoryObj } from "@storybook/react"
import "../styles/marketing.css"
import { CliPlayground, HarnessStrip, Section, UseCaseCards, type ExampleRun, type Harness, type HarnessCapture, type UseCase } from "./index"
// Real recordings: interactive `tangle agent prompt` sessions in one production sandbox, 2026-11-14,
// with the guest VM's address in the tmux title replaced. Development fixtures only, never product data.
import codexCast from "../../fixtures/marketing/codex.cast?url"
import opencodeCast from "../../fixtures/marketing/opencode.cast?url"
import piCast from "../../fixtures/marketing/pi.cast?url"
import commandRecord from "../../fixtures/marketing/run-code.json"
import fixRecord from "../../fixtures/marketing/fix-and-commit.json"
import claudeLogo from "../../fixtures/marketing/logos/claude-code.svg?url"
import codexLogo from "../../fixtures/marketing/logos/codex.png?url"
import hermesLogo from "../../fixtures/marketing/logos/hermes.png?url"
import kimiLogo from "../../fixtures/marketing/logos/kimi-code.png?url"
import openclawLogo from "../../fixtures/marketing/logos/openclaw.png?url"
import opencodeLogo from "../../fixtures/marketing/logos/opencode.svg?url"
import piLogo from "../../fixtures/marketing/logos/pi.svg?url"
import primeLogo from "../../fixtures/marketing/logos/prime-agent.png?url"

const meta: Meta = { title: "Marketing/Harness showcase", parameters: { layout: "fullscreen" } }
export default meta
type Story = StoryObj

const task = "Reply without tools using at least 60 characters: confirm you received this task in an interactive session and can accept a follow-up."
const followUp = "Reply without tools using at least 60 characters: confirm this follow-up arrived in the same interactive session and you are ready for another task."
const capture = (url: string, recordedAt: string, harnessVersion: string, durationMs: number): HarnessCapture =>
  ({ url, ok: true, recordedAt, sandboxId: "sandbox-e6316a96d0db", harnessVersion, cliVersion: "0.22.120", durationMs })
const launch = (id: string) => `https://sandbox.tangle.tools/dashboard/new?harness=${id}`

const harnesses: Harness[] = [
  { id: "claude-code", name: "Claude Code", logo: claudeLogo, capture: null, launchHref: launch("claude-code") },
  { id: "codex", name: "Codex", logo: codexLogo, capture: capture(codexCast, "2026-11-14T09:08:10Z", "0.164.0", 132650), inputs: [task, followUp], launchHref: launch("codex") },
  { id: "opencode", name: "OpenCode", logo: opencodeLogo, capture: capture(opencodeCast, "2026-11-14T09:19:16Z", "1.19.4", 157881), inputs: [task], launchHref: launch("opencode") },
  { id: "pi", name: "Pi", logo: piLogo, capture: capture(piCast, "2026-11-14T09:19:24Z", "1.5.0", 149659), inputs: [task], launchHref: launch("pi") },
  { id: "kimi-code", name: "Kimi Code", logo: kimiLogo, capture: null, launchHref: launch("kimi-code") },
  { id: "hermes", name: "Hermes", logo: hermesLogo, capture: null, launchHref: launch("hermes") },
  { id: "openclaw", name: "OpenClaw", logo: openclawLogo, capture: null, launchHref: null },
  { id: "prime", name: "Prime Agent", logo: primeLogo, capture: null, launchHref: null },
  ...Object.entries({ amp: "Amp", "factory-droids": "Factory Droids", nanoclaw: "NanoClaw", nanocode: "Nanocode", exo: "Exo", acp: "ACP", cursor: "Cursor", grok: "Grok" })
    .map(([id, name]) => ({ id, name, capture: null, launchHref: null })),
]

type RunRecord = { run: { id: string; recordedAt: string; exitCode: number; costUsd: number | null; sdk: Record<string, string> }; source: { sha256: string }; events: NonNullable<ExampleRun["events"]> }
const run = (record: RunRecord): ExampleRun => ({
  url: "", runId: record.run.id, recordedAt: record.run.recordedAt, sha: record.source.sha256, sdk: record.run.sdk["@tangle-network/sandbox"],
  costUsd: record.run.costUsd, exitCode: record.run.exitCode, events: record.events,
  ms: Math.max(0, ...record.events.map((event) => event.atMs + (event.durationMs ?? 0))),
})
const cases: UseCase[] = [
  { slug: "run-code", title: "Run a command in a sandbox", run: run(commandRecord as RunRecord), lead: "Command exited with code 0",
    templateHref: "https://tangle.tools/?example=sandboxes/run-code#quickstart", links: [{ label: "Run record", href: "https://github.com/tangle-network/brand/blob/main/packages/ui/fixtures/marketing/run-code.json" }] },
  { slug: "fix-and-commit", title: "Fix a failing test and commit", run: run(fixRecord as RunRecord), lead: "Fix committed",
    templateHref: "https://tangle.tools/?example=sandboxes/fix-and-commit#quickstart", links: [{ label: "Run record", href: "https://github.com/tangle-network/brand/blob/main/packages/ui/fixtures/marketing/fix-and-commit.json" }] },
]

export const Showcase: Story = {
  render: () => <main>
    <Section id="agents" heading="Every coding agent, installed.">
      <HarnessStrip harnesses={harnesses} hrefTemplate="https://sandbox.tangle.tools/dashboard/new?harness={id}" />
    </Section>
    <Section id="cli" heading="The tangle CLI.">
      <CliPlayground
        commands={[
          { label: "Prompt Pi in a sandbox", command: `tangle agent prompt sandbox-e6316a96d0db "…" --interactive --harness pi`, cast: piCast },
          { label: "Prompt Codex in a sandbox", command: `tangle agent prompt sandbox-e6316a96d0db "…" --interactive --harness codex`, cast: codexCast },
        ]}
        login={{ command: "tangle login", href: "https://sandbox.tangle.tools/login", note: "Opens sign-in. This page runs no shell." }}
      />
    </Section>
    <Section id="use-cases" heading="Recorded runs you can start from.">
      <UseCaseCards cases={cases} />
    </Section>
  </main>,
}

export const LegacyLinks: Story = {
  render: () => <Section id="legacy" heading="Every coding agent, installed.">
    <HarnessStrip harnesses={harnesses.slice(0, 8).map(({ id, name, logo }) => ({ id, name, logo }))} hrefTemplate="https://sandbox.tangle.tools/dashboard/new?harness={id}" liveLabel="Run Pi now" />
  </Section>,
}
