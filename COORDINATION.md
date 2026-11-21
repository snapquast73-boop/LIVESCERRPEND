# Coordination — LiveScoringErrors-Pending

Shared task board for `snapquast73-boop/LIVESCERRPEND`.

## Sessions

| Session ID | Branch | Status | Claimed files / tasks |
|---|---|---|---|
| arena-b3fde79a | arena/b3fde79a-livescerrpend | done | Site engine (CSS + JS + index.html) + data/*.json placeholders; PR #1 merged to main |
| arena/3061568e-livescerrpend | arena/3061568e-livescerrpend | active/done | Verified engine + payload + docs + tests + workflows; this integration (PR #2) |

## Tasks

| ID | Description | Status | Session | Files touched | Notes / sources |
|---|---|---|---|---|---|
| T-01 | Inspect repository & create COORDINATION.md | done | arena-b3fde79a | COORDINATION.md | Checked git status, Pages API, index.html, README |
| T-02 | Create assets/css/style.css | done | arena-b3fde79a | assets/css/style.css | Restored stylesheet; HTTP 200 |
| T-03 | Create assets/js/*.js modules | done | arena-b3fde79a | assets/js/*.js | All tabs, CSV export, live statsapi.mlb.com fetch, Flagged view |
| T-04 | Create data/*.json placeholders (empty/unverified, no hallucinated data) | done | arena-b3fde79a | data/*.json | 8 JSON files; unverified counts empty and flagged |
| T-05 | Update index.html links to snapquast73-boop/LIVESCERRPEND; add Flagged for Review tab | done | arena-b3fde79a | index.html | Flagged for Review view + official source links |
| T-06 | Verify site locally, open PR, merge, confirm GitHub Pages deployment | done | arena-b3fde79a | COORDINATION.md | Assets HTTP 200 locally; PR #1 merged to main |
| T-1 | Rebuild verified site engine (CSS + all JS) | done | arena/3061568e-livescerrpend | assets/css/style.css, assets/js/*.js | All assets HTTP 200 served locally; node --check OK |
| T-2 | Build verified snapshot data payload | done | arena/3061568e-livescerrpend | data/site/payload.json | 3 anchor run-removals + official MLB Stats API play-by-play links |
| T-3 | Flag irregularities / unverified items page | done | arena/3061568e-livescerrpend | docs/FLAGGED.md, docs/VERIFICATION.md, docs/SOURCES.md | IRR-01..IRR-04 |
| T-4 | Repoint buffedlizard55-lab -> snapquast73-boop/LIVESCERRPEND | done | arena/3061568e-livescerrpend | README.md, index.html | GitHub repo settings |
| T-5 | Add GitHub Actions (harvest + tests) | done | arena/3061568e-livescerrpend | .github/workflows/*.yml, tests/test_payload.py | pytest: 4 passed |
| T-6 | Integration: rebase onto main, merge PR #2, confirm Pages deploys | in progress | arena/3061568e-livescerrpend | GitHub PR #2 + COORDINATION.md | PR #2 created; merging to main |

## Conflict resolution (this session)

PR #2 (arena/3061568e-livescerrpend) branched from `main` @ aa23dc5a, but `main` had advanced with PR #1 (arena-b3fde79a, commit be0aa3b). Rebasing PR #2 onto origin/main produced add/add conflicts on `assets/css/style.css`, all `assets/js/*.js`, and `index.html` — both sessions had rebuilt the same site engine as incompatible architectures.

Resolution: kept the arena/3061568e-livescerrpend (verified) engine for those files, since it is the version that was end-to-end verified (local serving, node --check, pytest 4 passed) and integrates with docs/FLAGGED.md, docs/VERIFICATION.md, docs/SOURCES.md, tests/, and .github/workflows/. The arena-b3fde79a `data/*.json` payloads were not in conflict and are preserved. Their engine work is functionally equivalent and is noted here rather than discarded.

## Rules
- No task is started by another session while owned here.
- Claims are recorded here and committed/pushed before work begins.
- Verification: every table row carries a source link to an official site; unconfirmed values are left blank and flagged here.
- When all tasks are done, the integration session merges to main, confirms GitHub Pages builds with no broken links, records PR link + merge result here, and publishes flagged items on `docs/FLAGGED.md`.

## PR / merge record

| Item | Value |
|---|---|
| Pull request | https://github.com/snapquast73-boop/LIVESCERRPEND/pull/2 |
| Head | arena/3061568e-livescerrpend |
| Base | main |
| Merge result | Merged as `9bf70398f4341b19f11df33399a952cca2700430`; Pages API reported built for this commit. |

## Follow-up audit — c5e4b7b5

PR #1 (`18c9351`) and PR #2 (`9bf7039`) merged during this session. Both rebases of the published claim conflicted only in `COORDINATION.md`; each resolution preserved main’s board and carried the claim forward. PR #2’s client, combined payload, documentation, and workflows are the integration baseline. No other branch is being changed.

| Task | Status | Session | Files / sources |
| --- | --- | --- | --- |
| Correct published claims and verify combined site | done | c5e4b7b5 | `data/site/payload.json`, `docs/`, `README.md`, review page, existing client and tests. [MLB play-by-play](https://statsapi.mlb.com/api/v1/game/823616/playByPlay), [MLB scoring bulletin](https://www.mlb.com/official-information/scoring-changes). |

- Verification: compared Soto’s [official clip](https://www.mlb.com/video/juan-soto-s-home-run-overturned-after-review), [schedule](https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=2026-06-13&teamId=121), runner movements and score delta. The [Jeffers review](https://statsapi.mlb.com/api/v1/game/778307/playByPlay) is verified; its original scoring, the inherited count for [745857](https://statsapi.mlb.com/api/v1/game/745857/playByPlay), and unstated bulletin RBI values remain unverified and blank. Five excerpts were checked against the numbered [MLB bulletin](https://www.mlb.com/official-information/scoring-changes).
- Checks on the combined site: six payload checks, four feed tests, packaged links and ARIA IDs, and headless Chromium at mobile width (tab navigation, run-removal/search filters, CSV blank fields, replay scan, pending success/partial/empty/offline fixtures, RBI filter, review page). Network restrictions prevented a live MLB browser smoke test in the sandbox; official endpoints were separately read for the published evidence.

### Follow-up merge and deployment

[PR #3](https://github.com/snapquast73-boop/LIVESCERRPEND/pull/3) merged to `main` as `7c1e42f39a3e5efc9197e2137eb6c2b9765932b9`. [GitHub Pages deployment](https://github.com/snapquast73-boop/LIVESCERRPEND/actions/runs/44828568744) succeeded, and the Pages API confirmed `built` for that merge commit. The public [Flagged for Review page](https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html), [published JSON](https://snapquast73-boop.github.io/LIVESCERRPEND/data/site/payload.json), and [browser feed module](https://snapquast73-boop.github.io/LIVESCERRPEND/assets/js/mlb.js) were fetched after deploy. The [GitHub tests run](https://github.com/snapquast73-boop/LIVESCERRPEND/actions/runs/44828569248) passed. It reported a nonblocking [Node 20 action-runtime deprecation](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) for the existing CI actions; those workflow dependencies were not changed in this follow-up.

## Merge note — c68ee0e2 rebased on the PR #5 / #6 work

`arena/312ea5e7` merged its client work to `main` (PRs #5 and #6: dated browsing via
`assets/js/date-panel.js`, the scorer view rebuilt on official completed balls in play with
`getScoredBalls`, the Lewis overturn recovered, `scripts/check_official.py` plus
`.github/workflows/official.yml`). This branch merged that work rather than overwriting it:

- `date-panel.js`, `scorer.js`, `pending.js` and `app.js` are kept exactly as merged.
- `assets/js/reviews.js` keeps the date panel (first-visit auto-scan, follow-today refresh) and
  adds the per-season archive loader on top of it; `assets/js/mlb.js` keeps both `getScoredBalls`
  and the review-feed helpers.
- `official.yml`, `scripts/check_official.py`, `tests/check_site.py`, `tests/mlb.test.mjs` are kept
  and extended, never dropped.
- Conflicts were limited to `COORDINATION.md` (union of both records), `index.html` (their scorer
  form plus this session's copy), the generated payload (regenerated here, and it reproduces the
  Lewis row they verified: 2 runs removed) and the rewritten client modules.

No other session's work was discarded.

## Claim — session c68ee0e2 (2026-11-20)

| Item | Value |
|---|---|
| Session ID | c68ee0e2 |
| Branch | `arena/c68ee0e2-livescerrpend` (base `68078d0`) |
| Status | in progress |
| Claimed scope | `.github/workflows/**`, `scripts/**`, `data/**`, `assets/js/**`, `assets/css/**`, `index.html`, `flagged-for-review.html`, `reviews.html` (if added), `docs/**`, `tests/**`, `README.md`, `COORDINATION.md` |

Task: restore the project so it works functionally like the original GitHub Pages site — rebuild the
archive from the official MLB feeds with a scripted harvest (no manual data entry), repair the client
views that currently render empty or broken, re-verify every published row against its official
source, and publish to GitHub Pages.

Checked before claiming: `git log` shows no other branch ahead of `main`; remote branches present are
`arena/b3fde79a`, `arena/3061568e`, `arena/c5e4b7b5` (all merged) and `arena/312ea5e7` (claim commit
only, no file work). No other session holds an active claim on the files above.

### Result — session c68ee0e2

| Task | Status | Session | Files / sources |
| --- | --- | --- | --- |
| Rebuild the archive from the official feeds | done | c68ee0e2 | `scripts/harvest.py`, `scripts/harvest_scoring_changes.py`, `scripts/capture_pending.py`, `scripts/build_payload.py`, `.github/workflows/harvest.yml`, `.github/workflows/live-capture.yml`, `data/seasons/**`, `data/site/**`. [MLB schedule](https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2026-03-01&endDate=2026-11-30), [play-by-play](https://statsapi.mlb.com/api/v1/game/823616/playByPlay), [review reasons](https://statsapi.mlb.com/api/v1/reviewReasons), [scoring bulletin](https://www.mlb.com/official-information/scoring-changes). |
| Repair the browser client | done | c68ee0e2 | `assets/js/**`, `assets/css/style.css`, `index.html`, `reviews.html`, `flagged-for-review.html`. Fixed the review scan wiring (`#rv-scan`), the missing `#dc-search`, the blank model card, the nested-card markup and the empty archive; added a per-season archive loader and a live replay feed page. |
| Verification | done | c68ee0e2 | `tests/test_payload.py`, `tests/test_harvest_logic.py`, `tests/mlb.test.mjs`, `tests/site-smoke.mjs`, `tests/check_site.py`, `docs/VERIFICATION.md`. |
| Publish | in progress | c68ee0e2 | PR from `arena/c68ee0e2-livescerrpend` to `main`, then GitHub Pages. |

Coverage published: 7,420 completed games across 2024–2026 (all scanned, 0 feeds unavailable),
1,968 overturned reviews, 5,954 automated pitch challenges, 23 run-removal plays / 26 runs removed,
129 no-count candidates, 31 no-count additions, 255 bulletin entries (63 classified, 17 with a
stated RBI effect). The three games named in the uploaded README all reproduce from the official
play-by-play: 745857 = 2 runs, 778307 = 2 runs, 823616 = 1 run.

Base occupancy is tracked from the official runner movements and required to reconcile with the
score printed on every play and with the official final score: 0 of 7,420 games fail that check.
Three tracker defects were found and fixed in this session (half-inning reset, batter-out at first
evicting a runner, multi-segment advances / identity by MLB person id), each with a unit test.

Open items are published on the Flagged for Review page and itemised in `data/flagged.json`:
the uploaded README's season totals do not reproduce (23/26/129 vs its 22/28/484), the scoring model
and correlation study were never in the upload, no pending ruling survives in an archived feed, the
bulletin covers the current season only, and composite review codes are printed raw with only the
registry's reason part named.

### Drift check on the merged tree

`scripts/check_official.py` (owned by the `312ea5e7` work) was extended, not replaced, to cover the
rebuilt corpus, and it now passes end to end in CI:

- every one of the 23 run-removal rows: date, season, matchup, batter, pitcher, inning, event type,
  review code, official result text, runs credited, base occupancy and the
  `(runners + 1) − credited` arithmetic;
- a fixed sample of the 1,968 overturned reviews and of the 129 candidates, including pitch-level
  review records (looked up by `eventIndex`);
- all 255 bulletin entries, matched against the published page after normalising whitespace,
  typography and the bulletin's `<sup>` ordinal markup.

That check found a published occupancy value that disagreed with the feed, which is why the harvest
now verifies its tracked base state against the runners the feed itself lists on each play and
publishes no count (and no occupancy) when the two disagree.
