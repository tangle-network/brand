# Drift ratchet

`tangle-drift` counts design-system drift in each product surface and fails a consumer's gate when a count rises.
The scanner is `packages/brand/bin/tangle-drift.mjs`; the baseline it compares against is `packages/brand/bin/drift-baseline.json`.
Both ship in `@tangle-network/brand`, so the baseline a consumer checks against is the one in the brand version it installs.

It ports the company scanner `wiki/evidence/ui-unification-2026-10-05/drift.py` with the same patterns and pathspecs.
Counts are regex matches on source read from a git tree with `git grep`, not rendered output.

## What is gated

| Metric | Pattern | Files |
| --- | --- | --- |
| `raw_palette` | Tailwind palette utilities such as `bg-amber-500`, `text-slate-50` | `.tsx .jsx .astro .ts` |
| `hex` | `#rgb` and `#rrggbb` literals | `.tsx .jsx .astro .css` |
| `arbitrary_color` | `-[#…]`, `-[rgb(…)]`, `-[hsl(…)]`, `-[oklch(…)]` | `.tsx .jsx .astro .ts` |
| `css_var_defs` | `--name:` definitions | `.css` |
| `local_primitive_count` | `export function/const Button` and the other primitive names the shared packages own | `.tsx .jsx` |
| `font_size_literal` | Literal font sizes: `text-[13px]`, inline `fontSize: 13`, CSS `font-size: 13px` | `.tsx .jsx .astro .ts .css` |
| `size_literal` | Literal heights and squares: `h-[34px]`, `min-h-[2.5rem]`, `size-[30px]` | `.tsx .jsx .astro .ts` |
| `native_control` | `<button>`, `<input>`, `<select>`, `<textarea>` elements | `.tsx .jsx .astro` |
| `control_override` | `Button`, `Input`, `Textarea` or `SelectTrigger` with a `className` height, padding, text size, corner or weight on the tag's line | `.tsx .jsx` |

The last four measure deviation from the [control and type scale](control-scale.md); token references such as `h-[var(--control-height-sm)]` are not counted.
`control_override` reads one line, so a `className` on a later line of the tag is not counted.

SUPER also counts `.js` and `.html` for palette and hex, because its interface is plain JavaScript and HTML.
Tests, stories, fixtures, `dist`, `node_modules`, `.d.ts`, generated, proof and evidence paths are excluded.
Each baseline row also records file counts, shared-package versions and the number of files importing each shared package; those are informational and never gated.

## Consumer gate

With `@tangle-network/brand` as a dependency, add this to the local gate:

```bash
pnpm exec tangle-drift check --surface gtm --repo-dir .
```

It reads the checkout's `HEAD` by default; `--rev <tree-ish>` reads another commit and `--worktree` includes uncommitted and untracked files.
A surface whose repository does not depend on brand runs it with `pnpm dlx --package @tangle-network/brand tangle-drift check …`.
It exits 1 when any gated count is above the baseline, naming the metric, the files whose count rose above their own baseline count, and the matching lines.
It exits 0 when every count is equal or lower; when one is lower it prints the command that lowers the baseline.
A metric the baseline row has not recorded yet (one added after that row was written, or missing from a consumer's own `--baseline` file) is printed as not yet gated and does not fail; it gates from the first baseline that records it.

## Lowering and refreshing the baseline

The baseline records each surface's default branch, so lower it after the reduction lands there:

```bash
node packages/brand/bin/tangle-drift.mjs check --surface gtm --remote --update-baseline
node packages/brand/bin/tangle-drift.mjs check --all --remote --update-baseline
```

`--remote` shallow-fetches each repository's default branch (resolved from the remote) into `~/.cache/tangle-drift` as a partial clone that leaves blobs over 256 KiB on the server.
The first run of all fifteen surfaces (now sixteen, with insurance) took about seven minutes on GTR; a warm run takes under a minute.
`--update-baseline` writes the shipped baseline only with `--remote` (a local checkout may be a feature branch, and writing into an installed package would relax that consumer's gate); `--baseline <file>` writes another file.
`--update-baseline` refuses any row with a rise and exits 1, but still records any metric that row had not recorded; `--allow-rise` accepts the rise, and belongs only in a reviewed brand change that explains it.
Lowering takes effect for a consumer when it installs the brand release carrying the new baseline.

## Sizing and type baseline, 2026-10-08

Recorded from each default branch when the sizing metrics were added. Insurance joined as a surface in the same change.
Platform's row kept its earlier counts and head because its `arbitrary_color` rose from 21 to 22 since that row was written; its sizing counts were read at develop `b22b58f29`.

| Surface | Head | Font size literal | Size literal | Native control | Control override |
| --- | --- | ---: | ---: | ---: | ---: |
| website | `88fa36301` | 155 | 1 | 9 | 0 |
| sandbox | `b22b58f29` | 27 | 12 | 56 | 0 |
| platform | `b22b58f29` | 32 | 8 | 444 | 0 |
| intelligence | `b22b58f29` | 14 | 3 | 50 | 0 |
| gtm | `626313ec7` | 55 | 6 | 74 | 10 |
| tax | `d8cecba36` | 25 | 4 | 30 | 8 |
| legal | `3dda84fd4` | 19 | 1 | 38 | 4 |
| insurance | `8ab1851d5` | 65 | 0 | 35 | 0 |
| creative | `459b7f342` | 84 | 3 | 67 | 5 |
| physim | `d5fdb4760` | 302 | 0 | 52 | 0 |
| hospitality | `871f7e62b` | 116 | 0 | 83 | 0 |
| audits | `af6c5106a` | 103 | 8 | 16 | 12 |
| browser | `e2de2b85e` | 26 | 3 | 16 | 10 |
| builder | `031de7609` | 55 | 4 | 80 | 1 |
| blueprint | `1ac4236f8` | 50 | 28 | 404 | 18 |
| super | `30e0cd527` | 427 | 0 | 0 | 0 |

Insurance's first row also records raw palette 73, hex 162 and CSS variable definitions 183.

## Baseline, 2026-10-05

| Surface | Repository (branch @ head) | Palette | Hex | Arbitrary color | CSS var defs | Local primitives |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| website | tangle-website (master @ 68e009e45) | 7 | 1110 | 0 | 106 | 0 |
| sandbox | agent-dev-container products/sandbox/web (develop @ 014fd01e8) | 0 | 84 | 2 | 94 | 1 |
| platform | agent-dev-container products/platform/web (develop @ 014fd01e8) | 0 | 24 | 21 | 11 | 6 |
| intelligence | agent-dev-container products/intelligence/web (develop @ 014fd01e8) | 14 | 116 | 0 | 35 | 1 |
| gtm | gtm-agent (master @ 7a11a251e) | 67 | 99 | 0 | 177 | 0 |
| tax | tax-agent apps/web (main @ 232898919) | 133 | 8 | 7 | 8 | 0 |
| legal | legal-agent (main @ 0a0580127) | 1 | 136 | 2 | 267 | 0 |
| creative | creative-agent (master @ 511f5fd6f) | 223 | 307 | 35 | 337 | 0 |
| physim | physim apps/web (main @ d25cc6549) | 0 | 328 | 0 | 108 | 0 |
| hospitality | hospitality-agent (main @ bae7af661) | 0 | 168 | 0 | 205 | 0 |
| audits | redteam packages/website (main @ 4c65033a1) | 126 | 111 | 89 | 11 | 0 |
| browser | bad-app (main @ 2ed27c21f) | 43 | 40 | 43 | 45 | 0 |
| builder | agent-builder (main @ d9d8f3415) | 99 | 46 | 1 | 71 | 0 |
| blueprint | blueprint-agent apps/web (develop @ 85babb06b) | 2585 | 129 | 49 | 2 | 2 |
| super | super-agent public (main @ 617315b40) | 0 | 501 | 0 | 104 | 0 |

### Differences from the company baseline

Where both read the same commit, every count matches except `arbitrary_color`.
`drift.py` passed its arbitrary-color pattern `-\[(?:#|rgb|hsl|oklch)` to `git grep` as a bare argument; it begins with `-`, so `git grep` rejected it as an unknown option and the script counted 0 for every surface.
This scanner passes patterns with `-e`, which gives sandbox 2, platform 21, tax 7, legal 2, creative 35, audits 89, browser 43, builder 1 and blueprint 49.

`drift.py` read `origin/main` for agent-dev-container and blueprint-agent, whose default branch is `develop`.
The consumer gate compares a pull request branch with this baseline, so the baseline reads the default branch.
For agent-dev-container, `develop` was 927 commits ahead of `main`: platform moved from 188 to 211 source files, hex 4 to 24, CSS var definitions 5 to 11 and local primitives 4 to 6; sandbox CSS var definitions moved from 83 to 94; intelligence did not change.
For blueprint-agent, `develop` was 3 commits ahead and only `arbitrary_color` differs.

## Relation to the agent-app theme check

agent-app ships `agent-app-theme-check` (`src/theme-contract/`), which fails when a component references a theme token that the app's CSS never defines.
Drift stays a separate tool rather than an extension of that check.
The theme check enforces an absolute correctness invariant (an undefined token paints a transparent surface) against agent-app's own token file and needs zero violations; drift is a ratchet on counts measured against a per-surface baseline that only falls.
Drift also covers surfaces that do not depend on agent-app at all (the website and the Red Team audits site) and measures palette and primitive use that brand owns, so its baseline belongs in the brand release.
Folding the ratchet into agent-app would tie brand's drift baseline to agent-app's release cadence and give one CLI two unrelated failure meanings.
A consumer runs both.

## Known limits

The website surface reads `src` only. Its other scanned files were `.evolve/multi-pursue/variants/*.astro` and the archived rejected prototypes under `docs/delivery/`, which no route ships; `drift.py` counted them (560 of the 1110 hex literals in the first baseline).
The hex pattern counts `#rgb` and `#rrggbb` only, as `drift.py` did; `#rgba` and `#rrggbbaa` literals are not counted.
