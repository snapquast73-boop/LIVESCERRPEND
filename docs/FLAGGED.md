# Flagged for Review

This page lists irregularities and items that could not be confirmed from an official source during the
2026-11-20 rebuild. They do **not** block the merge or the GitHub Pages deploy. They are published here so
they can be reviewed after the site is live and changes requested.

**Rule applied:** every value that could not be confirmed from an official source is left blank and flagged.
Nothing here is inferred or filled in.

## Source of flagged items

The committed snapshot (`data/site/payload.json`, key `meta.irregularities`) carries the same list with
source links; it is rendered on the site's **Method & sources** page under "Coverage, freshness and
irregularities."

## Flagged items

| ID | Item | Status | Official source link |
|---|---|---|---|
| IRR-01 | This upload contained only `index.html` (static shell), `README.md`, `conftest.py` and `requirements.txt`. The `assets/`, `src/`, `scripts/`, `data/`, `docs/` and `.github/` trees were missing, so the GitHub Pages site was broken (every `<script src="assets/js/...">` and the CSS returned 404). Rebuilt as a standalone static site. | fixed in this session | https://github.com/snapquast73-boop/LIVESCERRPEND |
| IRR-02 | Original referenced repositories `buffedlizard55-lab/LiveScoringErrors-Pending` and `buffedlizard55-lab/MLB-overturned-calls` return 404 via the GitHub API (private or removed). Nothing from them is copied or assumed. | unverified | https://api.github.com/repos/buffedlizard55-lab/LiveScoringErrors-Pending |
| IRR-03 | Run-removal detailed inputs (date, teams, batter, runners on base, runs credited, clip, Gameday) for the three anchor plays could not be re-fetched because the sandbox cannot reach `*.mlb.com`. Only the documented `runs_removed` values and official play-by-play links are published; inputs are left blank. | unverified | https://statsapi.mlb.com/api/v1/game/778307/playByPlay |
| IRR-04 | GitHub Pages cannot reach `statsapi.mlb.com` from this environment, so the scheduled harvest (which needs `*.mlb.com`) cannot run here. The live pending panel fetches `statsapi.mlb.com` from the visitor's browser and degrades gracefully when unreachable. | unverified | https://developer.github.com/actions/ |
| IRR-05 | The verification anchors (gamePk 778307 = 2, 745857 = 2, 823616 = 1 runs removed) are documented in `README.md` V22/V23 as verified against the official play-by-play, but were **not re-fetched** in this session. | documented, not re-verified | https://statsapi.mlb.com/api/v1/game/778307/playByPlay |

## How to review

1. Open each official source link above.
2. Confirm whether the flagged value can now be read from that official source.
3. If confirmed, update `data/site/payload.json` and clear the flag; if not, leave it blank and keep it flagged.
4. Request changes via a pull request or issue on https://github.com/snapquast73-boop/LIVESCERRPEND.

---

*Data © MLB Advanced Media, L.P. This project is not affiliated with or endorsed by MLB.*
