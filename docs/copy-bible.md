# Tangle copy bible

The reader is a developer who has never heard of Tangle, deciding in five seconds whether this does their job. Every heading, subline, button, meta description and example comment on tangle.tools, in the docs and in launches passes one test: **would that developer care?** If the line is about us (our process, our proof, our effort, our architecture) and not about what they get, it fails.

Use this guide for product language, headline examples and chart labels. The [post guide](post-bible.md) covers examples for developer audiences.

## How the best pages in our market write

Home pages fetched 2026-11-02. Copy the shape, not the words.

| Page | Headline | Why it works |
|---|---|---|
| E2B | Every agent gets a machine | The reader's agent is the subject; the thing is concrete. |
| E2B | You ship the agent. We run the infrastructure. Our cloud or yours. | Division of labor in three short sentences. |
| Fly.io | Launch computers for agents, code sandboxes, and your next app. | Verb, then three nouns the reader owns. |
| Fly.io | Pay only for the seconds they run. | A billing fact a human checks. |
| Browserbase | Give your agents access to the whole web. | One capability, the reader's agents. |
| Cloudflare Workers | Deploy serverless functions globally in seconds | Verb, object, where, how fast. |
| Northflank | Run agents and everything they build. | Verb plus the outcome. |
| Modal | Create over a million Sandboxes in under a minute | A number, a unit, a verb. |

Shapes to never copy, from the same market: "Your AI Agent Accelerator" (Runloop: says nothing), "Secure and Elastic Infrastructure for Running Your AI-Generated Code" (Daytona: adjective stack), "Start Small. Scale Fast." (Replit: any product could say it), "Agentic Infrastructure" (Vercel: a category label as a headline).

## Headline patterns

1. **Start with what the reader can do.** "Give each agent its own machine." The next sentence can show what the agent does there.
2. **Verb + what you get.** "Run any coding agent. On any cloud." One command at most; two or three in a row shout at the reader.
3. **The reader's noun first.** "Every coding agent, installed." "Every agent gets a machine."
4. **A fact with a number.** "Pay only for the seconds they run." Only with today's measurement and its benchmark link.
5. **Division of labor.** "You ship the agent. We run the machine."

A subline exists only to add a fact the headline lacks. If it restates, delete it.

## Voice

- Nouns developers already use: coding agent, sandbox, key, bill, file, command, snapshot. Not harness (code only), primitive, substrate, surface, tile, tooling.
- Sentence case. One claim per sentence. Verbs over adjectives. No adjective you cannot measure.
- A heading may say what Tangle does. It is never about our proof: "Ran on production", "built with", "powered by", "proof over positioning" go next to the thing as a dated fact, never as the headline.
- Counts are not quality. Thirty-five examples is a number in a table; the page shows the examples.
- No labels above headings. No slogan a competitor could paste onto their page.
- Buttons name the action and its object: "Create a sandbox", "Copy file", "See plans".
- Meta descriptions say what the page gives in one sentence, in the reader's nouns.

## Charts and benchmark pages

A benchmark page is a one-line head, its headline numbers, and a dense grid of small charts: every measure we have, as much of it on one screen as fits.

- A chart is a title, marks and numbers. No subtitle, caption, note, run id, commit or "lower is better".
- The title names the thing in the reader's nouns: "Lifecycle, base image", "First reply, from create".
- Draw the uncertainty on the chart. A latency row is a p50 dot, a p95 diamond and each one's 95% confidence band, with p50, p95 and n lined up at the row's end.
- A score board is columns: model and harness across, score up, a confidence whisker on each.
- Hover adds what the chart cannot hold. A tooltip is a bold title, then aligned key and value lines, never wrapped or cut.
- No competitors on a benchmark page until we are competitive.
- One row per entrant. A second run is history, not a second row.
- One chart per measure. Never the same numbers as a chart and a table.
- A printed rate comes from the record that states it. If a run failed a check, the row says so. Nothing partial goes up: every cell shown ran to completion with a valid grade.
- Sources and caveats get one short footer, not a line under every chart.
- Every chart comes from [`@tangle-network/charts`](https://github.com/tangle-network/charts), rendered with `{ presentation: "panel" }` in a grid. Never hand-roll one in a page.

## Code comments in public examples

One line, under 90 characters, saying what the code cannot: a fact about the platform the reader would otherwise have to test. Never what something does not do; a limitation is an issue, not a comment. If the code already says it, no comment.

```diff
- // The Daytona adapter runs this command in the sandbox and nothing else: it
- // does not install claude-code, read the profile's harness or report cost. The
- // snapshot needs the claude CLI installed and logged in.
+ // Daytona runs the command; the snapshot must have claude installed and logged in.
```

## Homepage copy examples

| Was | Now | Why |
|---|---|---|
| Every example ran on production. | Give each agent its own machine. | The reader can picture where their code will run. |
| Pick a job. Copy the file. Run it. | Give each agent its own machine. It can edit your repo and run the tests. You get a patch to review. | The subline names the work and what the developer gets back. |
| Run any harness. On any cloud. | Run any coding agent. On any cloud. | "Harness" is our word. |
| Installed in every sandbox, keys set. Click one to start it. (under "Every coding agent, installed.") | Click one to start it in a new sandbox. | The subline restated the heading. |
| One SDK. | Run any coding agent. | A slogan any SDK could use. |
| Run agents on the harnesses you already use, on any cloud: Claude Code, Codex, OpenCode and more, each in its own sandbox on Tangle. | Claude Code, Codex, OpenCode and more, each in its own sandbox, on any cloud. | Shorter, reader's nouns. |
