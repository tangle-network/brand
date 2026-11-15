# Post bible

How Tangle writes for X, and what it shows. Every rule comes from 6,611 public posts by 50 accounts developers follow (agent sandboxes, browser agents, model routers, coding-agent tools, deploy platforms, their founders, independent developers), read on 2026-11-15 over the prior 180 days. 574 of them were read and looked at by hand. Paid-shaped posts are left out. Outages, acquisitions, funding and other people's model news are left out too: they top raw reach and nobody can schedule them.

Each post is judged against its own account: **lift** is its views over that account's median. **Saves** are bookmarks per 1,000 views: a developer saving a post to try later. Counts were read on 2026-11-15 and move after that.

The [copy bible](copy-bible.md) owns voice and the running list of rejected copy. This page owns posts.

## What to show

### 1. Show it running: a clip of the real screen, under 30 seconds, the screen in the first frame.
Clips beat their account's median by 3.9x; photos by 0.9x (n=74 and 75, launches, demos, how-tos, charts and opinions only). Clips of 30 s or less: 9.8x and 5.4 saves; over 90 s: 1.9x. In the 12 best clips, frame one is the product (a terminal, a prompt box, the app), never a logo.
- [hyperbrowser /harness](https://x.com/hyperbrowser/status/2064775722976325793): 20 s, Claude Code terminal, the command typed at 2 s. 54x, 12.1 saves.
- [ctatedev agent-desktop](https://x.com/ctatedev/status/2116323148706771302): 20 s, the agent clicking through real apps. 71x, 8.2 saves.
- [aidenybai /react-doctor](https://x.com/aidenybai/status/2059303624266977296): 16 s, typed command, score 57 to 100, ends on the install line. 28x, 11.2 saves.
- Broke it: [Modal, Nemotron now available](https://x.com/modal/status/2110792218684670454): 10 s of logos on a starfield. 0.2x, 0 saves.
```diff
- Visual: a 1600x900 still of the editor after the run.
+ Visual: 33 s of the terminal, from clone to 9 passing tests.
```

### 2. Show the result, not the tool at rest.
Posts whose media shows the outcome: 2.9x and 3.2 saves, against 1.2x and 1.9 (n=66 and 225). Higher with it in 19 of 26 accounts.
- [ctatedev, Slack agent](https://x.com/ctatedev/status/2118853661040295997): the question, then the dashboard it built. 12.9x, 19.7 saves.
- [stevekrouse, Jev browser](https://x.com/stevekrouse/status/2100321685081559542): ends on "goal reached". 21x.
- Broke it: [ctatedev, wterm for Svelte](https://x.com/ctatedev/status/2096008176319512848): a code card, nothing run. 0.2x.

### 3. Let the frame keep the time.
Six of the 12 best clips show a running timer: the product's own ("Running (14s)", "Total 0.75s") or a clock. In 6,611 posts none says its video is sped up; four say theirs is not ([nutlope](https://x.com/nutlope/status/2100614659690713543), 1.9x). If you cut or speed up, a clock in the frame shows the real elapsed time and the text says nothing about it. Naming the demo is fine: 14 posts that say what their clip shows ("Quick demo of floating panes") ran 2.5x.
- [hyperbrowser /web](https://x.com/hyperbrowser/status/2062246808282439867): 20 s on screen while Claude Code's own timer reads 1m 14s. 50x.
- [ctatedev json-render vs jev](https://x.com/ctatedev/status/2101022101750571357): two panes, a timer in each. 63x.
```diff
- The agent worked for 3 min 53 s; the video is sped up.
+ (no sentence: the clock in the corner runs 0:11 to 0:44)
```

### 4. No caption text over the product.
Clips without burned-in captions: 6.8x and 4.2 saves; with them: 1.0x and 3.0 (n=43 and 21; 5 of 7 accounts). Title cards and taglines did not save a clip. One exception worked: [nutlope, IKEA](https://x.com/nutlope/status/2113715630386077804), a 3 s title then the app, 29.6x.

### 5. A number is one you measured, drawn on a chart.
Posts with the poster's own measurement: 8.0x (n=33; higher in 14 of 17 accounts). Charts: 10.9x (n=22).
- [cline, Terminal-Bench](https://x.com/cline/status/2083094354030362858): four bars, the score on each. 70x.
- [cline, cost per task](https://x.com/cline/status/2083638204037820734): $0.03 against $3.15, the source named. 54x.
- Broke it: [Vercel, a customer's deploy count](https://x.com/vercel/status/2106094197468205371): someone else's number, no chart. 0.2x.

### 6. No picture of text or of code at rest. Text alone is better.
Images of text: 0.6x; code stills: 0.6x; a UI at rest: 0.7x; no media at all: 1.3x.
- [iannuttall](https://x.com/iannuttall/status/2100982108873191861): text only, an install line and the prompt to run after it. 13x, 26.9 saves, the highest save rate read.
- Broke it: [ctatedev, zerolang](https://x.com/ctatedev/status/2061845110464078078): a screenshot of a changelog. 0.2x.

## What to write

### 7. Put the input in the post: one command, the one that does the work.
Posts a reader can copy from are saved more: 2.6 against 2.0 (n=28 and 263). Views are no higher (1.3x either way): this rule is for saves. Of 45 posts with a command line, 44 carry exactly one; setup goes in the reply.
- [aidenybai](https://x.com/aidenybai/status/2059303624266977296): ends `npx react-doctor@latest`. 28x.
- [mlejva](https://x.com/mlejva/status/2074879556713132064): one line, `e2b sbx create grok`. 3.3x.
```diff
- Three commands: create the sandbox, prompt the agent, start a preview.
+ tangle agent prompt particles "Build a page in ~/app: ..." --stream
+ (create and preview start go in the reply)
```

### 8. Name the thing in the first line. Never open with a question.
First lines that ask a question: 0.6x (n=17). Lines that name the thing or announce it: 1.7x to 2.4x.
- Broke it: [PlanetScale](https://x.com/PlanetScale/status/2110775486486110566), "Did you know you can use variables in Postgres?" 0.2x.

### 9. Write enough to explain it. Short posts lose.
Over 280 characters: 3.0x; 100 or fewer: 0.7x (higher in 21 of 33 accounts). Threads: 2.5x against 1.1x (22 of 33).

### 10. No dates and no story of how we checked it.
0 of 6,611 posts put a date in the text. "We tested X against Y" with the result is fine: [kilocode](https://x.com/kilocode/status/2067915121532325929), 85x. "One recorded run, 2026-11-12" is not.
```diff
- The revert took 394 ms in one recorded run, 2026-11-02.
+ (the 394 ms is on screen, beside the line that took it)
```

### 11. Say the items, not how many there are.
Drew's rule (2026-11-02, 2026-11-15). The corpus does not penalize counts: the 7 posts that announce a count ran 6.4x, and Railway's "Zero sign-up. One command." ran 27x. Those posts then show every item. Ours counted instead of showing.
```diff
- Three commands: create the sandbox, prompt the agent, start a preview.
+ (the command itself, in the post; the others in the reply)
```

### 12. Post what you made, not where you will be.
Events, meetups, conference talks, office news: 0.4x (n=99; higher in 6 of 32 accounts). [Modal at re:Invent](https://x.com/modal/status/2121279422397587584): 0.1x.

### 13. Do not post five in the same shape: vary the opening, the length and the media.
Not measured in the corpus. The 12 best clips open on eight different screens: a chat window, a terminal, a prompt box, a desktop, a diagram, a live demo page, two empty panes, a 3D box.

## Who posts

A founder's own account reaches more people per follower than the company's: median views per 1,000 followers 296 for 15 founders and engineers against 160 for 25 company accounts. In 5 of 8 company and founder pairs the founder is ahead (E2B and its CEO: 169 against 310; Convex: 155 against 347; Trigger.dev: 146 against 462). The exception is the biggest: OpenCode's account (900) beats its builder (282). Post from the person; the company account quotes it.

## How it was checked

20 % of posts were set aside by a hash before any analysis; 60 of them, drawn at random, were coded without their counts. Scored one point per rule, the rules called 38 of 60 right against the account's median (63 %), and 23 of 30 (77 %) on the five kinds above.

## The running list: copy Drew rejected

Added here and in the [copy bible's list](copy-bible.md#the-running-list-copy-drew-rejected-in-his-words).

| Date | Drew | Rule |
|---|---|---|
| 2026-11-15 | Rejected every draft; asked for rules measured on real posts | This page. |
| 2026-11-15 | Counting the commands ("Three commands: create the sandbox, prompt the agent, start a preview.") | 11 |
| 2026-11-15 | "Just tell the commands"; "have the video show a time duration" instead of saying it is sped up | 3, 7 |
| 2026-11-15 | "We want examples! We want to visualize!" | 1, 2 |
| 2026-11-13 | Demos the way real people want to see them, not labelled and captioned; "visual like a movie! motion!" | 1, 4 |
