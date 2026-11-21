# LiveScoringErrors-Pending

**Every replay overturn that took a run off the scoreboard — derived from the official MLB
feeds — plus a live replay feed, live pending-ruling checks and MLB's own scoring-change bulletin.**

- **Site:** <https://snapquast73-boop.github.io/LIVESCERRPEND/>
- **Live replay feed:** <https://snapquast73-boop.github.io/LIVESCERRPEND/reviews.html>
- **Audit / limitations:** <https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html>

A static GitHub Pages site. No build step, no API key, no server: GitHub Pages publishes the
repository root from `main`
([publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)),
the data is committed JSON written by scripts in this repository, and the live views call the
public MLB Stats API straight from the visitor's browser.

## What this project does

The original brief asked whether a scoring decision can be predicted, whether an error can be
re-ruled into a hit or a fielder's choice, and what that does to the batter's RBI — plus "a full
list that follows our requirements, no hallucinations, verified line by line" and a feed that is
current without anyone checking by hand.

| Question | What the site answers | How it is sourced |
| --- | --- | --- |
| Which replay overturns took runs off the scoreboard? | *Run-removed overturns*: 2 seasons' worth of plays where the on-field call was a home run, a completed review overturned it, and the arithmetic on the official record says how many runs disappeared. | `scripts/harvest.py` reads every completed game's play-by-play from [statsapi.mlb.com](https://statsapi.mlb.com/api/v1/game/823616/playByPlay) |
| What is under review right now? | *Live replay feed* (`reviews.html`): one date's reviews, confirmed calls, reviews still in progress, ABS pitch challenges and any runs credited to the play under review. | the visitor's browser reads the [official schedule](https://statsapi.mlb.com/api/v1/schedule?sportId=1) and each game feed |
| Is a scoring decision still pending? | *Pending rulings*: the live panel checks today's Eastern Time schedule for the two registered codes `os_ruling_pending_primary` / `os_ruling_pending_prior`. | [event-type registry](https://statsapi.mlb.com/api/v1/eventTypes) |
| Did the Official Scorer change a call afterwards? | *Scorer decision changes*: every entry MLB publishes on its scoring-change page, with the official sentence quoted and a before/after ruling only when that sentence names both sides. | `scripts/harvest_scoring_changes.py` reads [MLB's scoring-change bulletin](https://www.mlb.com/official-information/scoring-changes) |
| What did the scorer actually rule on a completed ball in play? | *Live scorer*: completed balls in play from a date's official feeds, with MLB's reported ruling and RBI, filters and CSV. | [official play-by-play](https://statsapi.mlb.com/api/v1/game/823616/playByPlay) |
| What does the rule say about the RBI? | *Method & sources* / model card: Rule 9.04 is quoted, and no hypothetical RBI is invented. | [Official Baseball Rules](https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf) |

## How the numbers are produced

```text
MLB Stats API ─┐
               ├─ scripts/harvest.py ────────────┐
MLB bulletin ──┴─ scripts/harvest_scoring_changes.py ─┴─ scripts/build_payload.py ─┬─ data/site/payload.json
                                                                                   └─ data/site/reviews-<season>.json
                                                                                            │
GitHub Actions (harvest.yml, live-capture.yml) commit the JSON ──► GitHub Pages serves it ──┘
```

1. **Harvest.** `.github/workflows/harvest.yml` runs the scripts, then commits the refreshed JSON.
   `scripts/harvest.py` walks the official schedule for each season on file and reads every
   completed game's play-by-play. Nobody types a row by hand.
2. **Detect.** A review counts only when the feed says `isOverturned: true` and `inProgress: false`.
   Pending rulings count only on the two registered codes. A review code such as `NH` is decoded
   against MLB's own [review-reason registry](https://statsapi.mlb.com/api/v1/reviewReasons); the
   registry's part is named, the initiator letter is not invented.
3. **Compute.** `runs removed = (runners on base + 1 batter) − runs the corrected record credits`,
   and only for a completed review whose own text says the on-field call was a home run. Base
   occupancy is tracked from the official runner movements and checked two ways: every play's
   tracked runs must equal the score printed on that play, and the game total must equal the
   official final score. A game that fails either check publishes no count.
4. **Classify.** A bulletin entry gets a before/after call only when one official sentence names
   both sides of the change, and the sentence is quoted on the row.
5. **Verify.** `pytest -q`, `node --test tests/mlb.test.mjs`, `python3 tests/check_site.py` and
   `node tests/site-smoke.mjs` (a jsdom render of the real pages against the real payload) run in
   `.github/workflows/tests.yml` on every push and pull request, and
   `scripts/check_official.py` (`.github/workflows/official.yml`) re-reads the official feed and the
   bulletin for every published run-removal row plus a sample of reviews, candidates and all 255
   bulletin entries, to catch drift after publication.

Coverage, per-season counts, the verification anchors and every irregularity are published on the
[Flagged for Review page](https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html)
and in [docs/VERIFICATION.md](docs/VERIFICATION.md).

## What is *not* here

- **The 0–100 scoring model, its training corpus, its holdout metrics and the correlation study**
  were not part of the upload. They are not reconstructed, so no probability, Scoring Confidence
  Index or hypothetical RBI is published.
- **No pending-ruling history from the archive.** MLB replaces the pending marker with the
  corrected call, so an archived feed cannot show resolved cases. The live view and the
  `live-capture` workflow are the only ways a case is recorded; the archived count is reported as
  it is, including zero.
- **No re-hosted video.** Rows link to the official play-by-play and to Baseball Savant's clip page
  for the play id read from the feed.
- **No model outputs on the scorer view.** That tab shows what MLB actually ruled on completed balls
  in play (official ruling, RBI, score at the time); it does not score a ball in play itself.

Every open item is listed, with its official source link, on the
[Flagged for Review page](flagged-for-review.html).

## Run it locally

```sh
python3 -m http.server 8000
# http://localhost:8000/  — file:// cannot load the JSON and modules reliably
```

```sh
# checks (no network needed for the first three)
python3 -m pytest -q
node --test tests/mlb.test.mjs
python3 tests/check_site.py
npm install --no-save jsdom && node tests/site-smoke.mjs
```

Re-harvest the data yourself (needs internet access to `statsapi.mlb.com`):

```sh
python3 scripts/harvest.py --season 2026 --force
python3 scripts/harvest_scoring_changes.py
python3 scripts/build_payload.py
```

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html`, `reviews.html`, `flagged-for-review.html` | the three pages |
| `assets/js/` | browser client: payload loader, official-feed reader (`mlb.js`), one module per view |
| `assets/css/style.css` | the stylesheet |
| `scripts/harvest.py` | official schedule + play-by-play → per-season archive |
| `scripts/harvest_scoring_changes.py` | official scoring-change bulletin → classified entries |
| `scripts/capture_pending.py` | live poll of in-progress games for pending rulings |
| `scripts/build_payload.py` | archives → `data/site/payload.json` and per-season review files |
| `data/seasons/`, `data/site/` | the committed harvest and the published payload |
| `docs/` | sources, verification record, flag notes |
| `tests/` | payload, parser, page and harvest-logic checks |

Data © MLB Advanced Media, L.P. This project is not affiliated with or endorsed by MLB.
