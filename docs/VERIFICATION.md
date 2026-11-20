# Verification log — LiveScoringErrors-Pending

Every value on this site is traced to an official source. Where a value cannot be confirmed from an
official source, it is left blank and flagged (see `docs/FLAGGED.md`). Nothing is inferred or filled in.

## Verification anchors (run-removed overturns)

| gamePk | runs removed (published) | official source | status in this session |
|---|---|---|---|
| 778307 | 2 | https://statsapi.mlb.com/api/v1/game/778307/playByPlay | documented in README V22/V23; not re-fetched (sandbox cannot reach *.mlb.com) — flagged IRR-05 |
| 745857 | 2 | https://statsapi.mlb.com/api/v1/game/745857/playByPlay | documented in README V22/V23; not re-fetched (sandbox cannot reach *.mlb.com) — flagged IRR-05 |
| 823616 | 1 | https://statsapi.mlb.com/api/v1/game/823616/playByPlay | documented in README V22/V23; not re-fetched (sandbox cannot reach *.mlb.com) — flagged IRR-05 |

Method: `runs removed = (runners on base + 1 batter) − runs the final record credits`. Direction is read
from the final event, never from the "(home run)" parenthetical, because the same wording covers reviews
that award a home run.

## Pending-ruling codes (official registry)

| Code | Description | Official source |
|---|---|---|
| `os_ruling_pending_primary` | Official Scorer Ruling Pending | https://statsapi.mlb.com/api/v1/eventTypes |
| `os_ruling_pending_prior` | Official Scorer Ruling Pending (prior base-running event) | https://statsapi.mlb.com/api/v1/eventTypes |

Detection uses only these two registered event codes.

## Official sources referenced by the site

| What | URL | Used for |
|---|---|---|
| MLB Stats API — schedule | https://statsapi.mlb.com/api/v1/schedule | Official game list, per-game official date |
| MLB Stats API — play-by-play | https://statsapi.mlb.com/api/v1/game/{gamePk}/playByPlay | Live rulings, reviews, pending codes, errors, `playId`s |
| MLB Stats API — event types | https://statsapi.mlb.com/api/v1/eventTypes | Pending-ruling codes |
| MLB Stats API — review reasons | https://statsapi.mlb.com/api/v1/reviewReasons | Review code → description |
| Baseball Savant clip | https://baseballsavant.mlb.com/sporty-videos?playId={playId} | Click-to-watch clip |
| MLB — official scoring changes | https://www.mlb.com/official-information/scoring-changes | Scorer's own hit/error/fielder's-choice reversals |
| Official Baseball Rules (Rule 9) | https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf | Rules 9.01(a), 9.04, 9.05, 9.12 |
| GitHub Actions | https://docs.github.com/en/actions | Scheduled harvest automation |

## Repository integrity

| Check | Result |
|---|---|
| `index.html` loads all `<script src="assets/js/*.js">` | pass (HTTP 200, served locally) |
| `index.html` loads `assets/css/style.css` | pass (HTTP 200, served locally) |
| `data/site/payload.json` is valid JSON | pass |
| Every `run_removed` row carries a `source` link | pass (3 anchor rows) |
| Every anchor carries an official MLB play-by-play link | pass (3 links) |
| Original repos `buffedlizard55-lab/*` reachable | fail — 404 via GitHub API (IRR-02) |
| Sandbox reach of `*.mlb.com` | fail — cannot reach (IRR-04) |

## Notes

- The 2026-11-20 rebuild is a snapshot: the scheduled harvest could not run here because this sandbox
  cannot reach `*.mlb.com` (IRR-04). Harvest runs in GitHub Actions where network is available.
- No value in `data/site/payload.json` was inferred. Detailed inputs for the anchor plays (date, teams,
  batter, runners on base, runs credited, clip, Gameday) are blank and flagged (IRR-03).
