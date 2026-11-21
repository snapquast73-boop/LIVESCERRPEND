# Sources — LiveScoringErrors-Pending

Official sources only. Every number on the site is written by a script in this repository
from one of these endpoints, and every published row keeps the URL it came from.

| What | URL | Used for | Used by |
|---|---|---|---|
| MLB Stats API — schedule | https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2026-03-01&endDate=2026-11-30 | Official game list, final scores, official dates, game types | `scripts/harvest.py`, `scripts/capture_pending.py`, `assets/js/mlb.js` |
| MLB Stats API — play-by-play | https://statsapi.mlb.com/api/v1/game/{gamePk}/playByPlay | `reviewDetails`, runner movements, per-play score, pending codes, `playId`s — the record behind every row | `scripts/harvest.py`, `assets/js/mlb.js` |
| MLB Stats API — event types | https://statsapi.mlb.com/api/v1/eventTypes | The only two "Official Scorer Ruling Pending" codes: `os_ruling_pending_primary`, `os_ruling_pending_prior` | `scripts/harvest.py`, `scripts/capture_pending.py`, `assets/js/mlb.js` |
| MLB Stats API — review reasons | https://statsapi.mlb.com/api/v1/reviewReasons | Review code → description (the reason suffix of a feed code such as `NH`) | `scripts/harvest.py`, `assets/js/mlb.js` |
| MLB — official scoring changes | https://www.mlb.com/official-information/scoring-changes | The Official Scorer's post-game hit/error/fielder's-choice reversals and any stated RBI effect | `scripts/harvest_scoring_changes.py` |
| Baseball Savant — clip for a play id | https://baseballsavant.mlb.com/sporty-videos?playId={playId} | Click-to-watch link for a row's `playId`; nothing is re-hosted | row links |
| MLB game videos | https://www.mlb.com/video/game/{gamePk} | Official video page for a game | row links |
| Official Baseball Rules (Rule 9, the Official Scorer) | https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf | Rule 9.01(a) (scorer's authority), Rule 9.04 (RBI), Rule 9.05 (earned runs) — quoted, not re-interpreted | model card, documentation |
| GitHub Pages — publishing source | https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site | The publishing model this site relies on (branch `main`, repository root) | README |

Data © MLB Advanced Media, L.P. This project is not affiliated with or endorsed by MLB.
Video links point to MLB's own pages; no clip is copied, re-hosted or claimed as watched.
