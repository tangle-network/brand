# Tangle copy bible

The reader is a developer who has never heard of Tangle, deciding in five seconds whether this does their job. Every heading, subline, button, meta description and example comment on tangle.tools, in the docs and in launches passes one test: **would that developer care?** If the line is about us (our process, our proof, our effort, our architecture) and not about what they get, it fails.

[Copywriting anti-patterns](https://github.com/drewstone/dotfiles/blob/main/docs/anti-patterns/copywriting.md) owns the editing procedure (slop patterns, banned words, CTA rules). This page owns Tangle's voice, the headline patterns we copy from, and the running list of copy Drew rejected.

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

1. **Verb + what you get.** "Run any coding agent. On any cloud." "Pick a job. Copy the file. Run it."
2. **The reader's noun first.** "Every coding agent, installed." "Every agent gets a machine."
3. **A fact with a number.** "Pay only for the seconds they run." Only with today's measurement and its benchmark link.
4. **Division of labor.** "You ship the agent. We run the machine."

A subline exists only to add a fact the headline lacks. If it restates, delete it.

## Voice

- Nouns developers already use: coding agent, sandbox, key, bill, file, command, snapshot. Not harness (code only), primitive, substrate, surface, tile, tooling.
- Sentence case. One claim per sentence. Verbs over adjectives. No adjective you cannot measure.
- A heading is never about us. "Ran on production", "built with", "powered by", "proof over positioning" go next to the thing as a dated fact, never as the headline.
- Counts are not quality. Thirty-five examples is a number in a table; the page shows the examples.
- No labels above headings. No slogan a competitor could paste onto their page.
- Buttons name the action and its object: "Create a sandbox", "Copy file", "See plans".
- Meta descriptions say what the page gives in one sentence, in the reader's nouns.

## Code comments in public examples

One line, under 90 characters, saying what the code cannot: a fact about the platform the reader would otherwise have to test. Never what something does not do; a limitation is an issue, not a comment. If the code already says it, no comment.

```diff
- // The Daytona adapter runs this command in the sandbox and nothing else: it
- // does not install claude-code, read the profile's harness or report cost. The
- // snapshot needs the claude CLI installed and logged in.
+ // Daytona runs the command; the snapshot must have claude installed and logged in.
```

## Before and after on tangle.tools

| Was | Now | Why |
|---|---|---|
| Every example ran on production. | Pick a job. Copy the file. Run it. | The old line is about our proof; the new one is what the reader does with the editor below it. |
| Run any harness. On any cloud. | Run any coding agent. On any cloud. | "Harness" is our word. |
| Installed in every sandbox, keys set. Click one to start it. (under "Every coding agent, installed.") | Click one to start it in a new sandbox. | The subline restated the heading. |
| One SDK. | Run any coding agent. | A slogan any SDK could use. |
| Run agents on the harnesses you already use, on any cloud: Claude Code, Codex, OpenCode and more, each in its own sandbox on Tangle. | Claude Code, Codex, OpenCode and more, each in its own sandbox, on any cloud. | Shorter, reader's nouns. |

## The running list: copy Drew rejected, in his words

Add to this list every time Drew rejects a line. Date, quote, rule. Never remove an entry.

| Date | Drew | Rule |
|---|---|---|
| 2026-11-02 | "i don't like this run table around the billing area, stop with this nonsense! delete that, just one key one bill, for compute, inference, and observability, clean it up!" | A billing section states the offer in the reader's nouns; no receipts, ledgers or run tables as proof. |
| 2026-11-02 | "the benchmarks page is bad, i don't like this waterfall blog style thing, it should look like artificial analysis and vals ai! … I mean seriously up to par competing on design vision!" | A benchmark page is a leaderboard: title beside its intro and a dated leader line, leader cards, dense sortable tables with the bar in the row. Never a waterfall of prose sections. |
| 2026-11-02 | "this copy is SO BAD 'Every example ran on production.' … NO HUMAN USER CARES OR THINKS THIS IS GOOD" | A heading says what the reader gets or does, never what we did. |
| 2026-11-02 | "if theres small text labels subtext and nonsense that restates things with AI slop sounding bullshit CUT IT! JUST GET THE WHAT IN!" | No subline that restates. No labels above headings. |
| 2026-11-02 | "you don't need to COUNT examples per tab, you need to PUT GOOD AND COMPLETE EXAMPLES IN PLACE! … creative things! good use cases!" | Counts are not content. Show the thing. |
| 2026-11-02 | "SHORT AND SWEET is better than this terrible shit like '// The Daytona adapter runs this command in the sandbox and nothing else …' 'And nothing else?' … dont put all these stupid comments!" | One-line comments that state a fact. Never what something does not do. |
| 2026-11-02 | "no card shit that says nothing about what we do" | No cards whose text could describe any product. |
| 2026-11-02 | "tile" | Plain words; never a word we invented for the UI. |
| 2026-11-02 | tabs on one row, "it must fit" | Write a headline to the width it renders in. |
| 2026-11-01 | "One SDK." rejected | No slogans. |
| 2026-10-24 | "sleek, like an apple product" | Fewer words, bigger type, one idea per section. |
| 2026-10-22 | "talk to me in clear simple technical english terms and decisions … what kinda of mannered prose crap is this" | No mannered or clipped prose anywhere, including reports. |
