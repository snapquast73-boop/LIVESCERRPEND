# Sources — LiveScoringErrors-Pending

Official sources only. Every number on the website links to the record it came from.

| What | URL | Used for |
|---|---|---|
| MLB Stats API — schedule | https://statsapi.mlb.com/api/v1/schedule | Official game list, per-game official date |
| MLB Stats API — play-by-play | https://statsapi.mlb.com/api/v1/game/{gamePk}/playByPlay | Live rulings, reviews, pending codes, errors, `playId`s; the record behind every row |
| MLB Stats API — event types | https://statsapi.mlb.com/api/v1/eventTypes | The only two "Official Scorer Ruling Pending" codes |
| MLB Stats API — review reasons | https://statsapi.mlb.com/api/v1/reviewReasons | Review code → description |
| Baseball Savant clip | https://baseballsavant.mlb.com/sporty-videos?playId={playId} | Click-to-watch clip (nothing re-hosted) |
| MLB Film Room | https://www.mlb.com/video/search?q=playid="{playId}" | Alternate video route |
| MLB — official scoring changes | https://www.mlb.com/official-information/scoring-changes | Scorer's own hit/error/fielder's-choice reversals and RBI effect |
| Official Baseball Rules (Rule 9) | https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf | Rules 9.01(a), 9.04, 9.05, 9.12 |
| This repository | https://github.com/snapquast73-boop/LIVESCERRPEND | Rebuilt site engine, snapshot payload, automation |

Data © MLB Advanced Media, L.P. This project is not affiliated with or endorsed by MLB. Clip links point to
MLB's own public pages; nothing is re-hosted here.
