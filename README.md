# LiveScoringErrors-Pending

**Model provisional MLB scoring decisions, and show every replay overturn that took a run off
the scoreboard — with the clip, the arithmetic and the official record behind it.**

A live-feed project for hit/error/fielder's-choice outcome estimates, RBI-rule scenarios,
official scorer revisions, pending scorer rulings, and run-removing replay overturns. Every
number on the website is written by a script from an official MLB feed; nothing is typed by
hand and nothing is estimated to fill a gap.

**Website (GitHub Pages):** <https://snapquast73-boop.github.io/LIVESCERRPEND/>

---

## 0. Read this first, every session — the project brief

> **Standing instruction from the owner:** this section is the starting point for every
> working session. Re-read it, check the plan against it, then build.

### 0.1 The original brief (verbatim)

> I want to investigate if there is a way to accurately predict the outcome of any scoring decision such as a pending scoring decision, or if we can tell if an error would be overturned into another play such as a fielders choice or a hit. There's also the possibility of if the play is initially ruled an error that the batter gets no RBI if there is a runner on 2nd or 3rd. However if they rule it as a fielders choice or a hit, there's a chance that the batter would be awarded an RBI.
>
> Review the repo.
>
> I want to create a website that does the following: I want to investigate if there is a way to accurately predict the outcome of any scoring decision such as a pending scoring decision, or if we can tell if an error would be overturned into another play such as a fielders choice or a hit. There's also the possibility of if the play is initially ruled an error that the batter gets no RBI if there is a runner on 2nd or 3rd. However if they rule it as a fielders choice or a hit, there's a chance that the batter would be awarded an RBI.
>
> Let's see if these sites help with figuring out a game plan and then executing it so that we get the best scientific model that can generate a live score out of 100 for live events. Like if a ball gets hit, how will it be scored, let's see if baseballsavant live play by play batted ball game stats could help us. Use advanced correlation methods to generate live scoring.
>
> https://github.com/buffedlizard55-lab/MLB-overturned-calls
>
> It should be pretty straight forward, research and understand all the MLB overturned calls, and then find the videos that correspond to the play that resulted in a run being removed from the score. It should be as easy as click to download or make it so that i can click it and watch it in my browser.
>
> Put this prompt into the repo readme and read it everytime we work on the project as a starting point to make sure we are building what we are aiming for and have a strong base to continue building and improving on making something useful for everyday use. It should solve the problem of having to manually check everything ourselves and have an up to date current feed.
>
> Review the repo.
>
> The following is taken from the Arena AI team and I think it makes a good point on building a successful project, so let's keep the Core Values and Own the Outcome as a focal point when building, developing, researching, suggesting upgrades, and implementing the work.
>
> **Own the Outcome**
>
> We own results end to end — not just our individual slice of the work. When problems arise and we have the means to act, we do so without waiting for permission or assignment. We treat failure and success as signals and use them to improve. At Arena, we stay accountable to the final outcome.
>
> Work line by line verifying from official verified trusted sources, provide links for manual review. There should be no manual input, work on your own to complete tasks. Flag any irregularities for review. No hallucinations.
>
> Verify no hallucinations.
>
> The goal of this project is to get a full list that follow our requirements. No hallucinations. Verify line by line.
>
> Go ahead and create a pull request and then merge the pull request onto the main. Make suggestions for what work still needs to be done and any limitations that is in the way of a successful project. It should be worked on in this next session or the next session. Work line by line verify everything no hallucinations.
>
> Run this task through multiple passes.
> Pass 1: Implement the task completely and verify the result.
> Pass 2: Review your work for bugs, missing requirements, incorrect assumptions, and edge cases. Fix everything you find.
> Pass 3: Re-check the entire implementation against the original request. Improve accuracy, reliability, completeness, and code quality. Fix any remaining issues.
> Do not stop after the first pass. Each pass must build on the previous one. Before finishing, verify that the final result fully satisfies the original request. Work line by line verify everything no hallucinations.

### 0.2 This session's brief (verbatim)

> I want to investigate if there is a way to accurately predict the outcome of any scoring decision such as a pending scoring decision, or if we can tell if an error would be overturned into another play such as a fielders choice or a hit. There's also the possibility of if the play is initially ruled an error that the batter gets no RBI if there is a runner on 2nd or 3rd. However if they rule it as a fielders choice or a hit, there's a chance that the batter would be awarded an RBI.
>
> Review the repo.
>
> I want to create a website that does the following: I want to investigate if there is a way to accurately predict the outcome of any scoring decision such as a pending scoring decision, or if we can tell if an error would be overturned into another play such as a fielders choice or a hit. There's also the possibility of if the play is initially ruled an error that the batter gets no RBI if there is a runner on 2nd or 3rd. However if they rule it as a fielders choice or a hit, there's a chance that the batter would be awarded an RBI.
>
> Let's see if these sites help with figuring out a game plan and then executing it so that we get the best scientific model that can generate a live score out of 100 for live events. Like if a ball gets hit, how will it be scored, let's see if baseballsavant live play by play batted ball game stats could help us. Use advanced correlation methods to generate live scoring.
>
> https://github.com/buffedlizard55-lab/MLB-overturned-calls
>
> It should be pretty straight forward, research and understand all the MLB overturned calls, and then find the videos that correspond to the play that resulted in a run being removed from the score. It should be as easy as click to download or make it so that i can click it and watch it in my browser.
>
> Put this prompt into the repo readme and read it everytime we work on the project as a starting point to make sure we are building what we are aiming for and have a strong base to continue building and improving on making something useful for everyday use. It should solve the problem of having to manually check everything ourselves and have an up to date current feed.
>
> Review the repo.
>
> The following is taken from the Arena AI team and I think it makes a good point on building a successful project, so let's keep the Core Values and Own the Outcome as a focal point when building, developing, researching, suggesting upgrades, and implementing the work.
>
> **Own the Outcome**
>
> We own results end to end — not just our individual slice of the work. When problems arise and we have the means to act, we do so without waiting for permission or assignment. We treat failure and success as signals and use them to improve. At Arena, we stay accountable to the final outcome.
>
> Work line by line verifying from official verified trusted sources, provide links for manual review. There should be no manual input, work on your own to complete tasks. Flag any irregularities for review. No hallucinations.
>
> Verify no hallucinations.
>
> The goal of this project is to get a full list that follow our requirements. No hallucinations. Verify line by line.
>
> Site creation
>
> Create a github page for this repo that has clean ui, user friendly, simple and easy to use.
>
> It should be organized and clean. It should include all relevant information in an easy to read format with official verified links as sources for review. Work line by line verify everything no hallucinations.
>
> Go ahead and create a pull request and then merge the pull request onto the main. Make suggestions for what work still needs to be done and any limitations that is in the way of a successful project. It should be worked on in this next session or the next session. Work line by line verify everything no hallucinations.
>
> Run this task through multiple passes.
> Pass 1: Implement the task completely and verify the result.
> Pass 2: Review your work for bugs, missing requirements, incorrect assumptions, and edge cases. Fix everything you find.
> Pass 3: Re-check the entire implementation against the original request. Improve accuracy, reliability, completeness, and code quality. Fix any remaining issues.
> Do not stop after the first pass. Each pass must build on the previous one. Before finishing, verify that the final result fully satisfies the original request. Work line by line verify everything no hallucinations.

### 0.2b The brief for this session (2026-09-29, verbatim)

> I want to investigate if there is a way to accurately predict the outcome of any scoring decision such as a pending scoring decision, or if we can tell if an error would be overturned into another play such as a fielders choice or a hit. There's also the possibility of if the play is initially ruled an error that the batter gets no RBI if there is a runner on 2nd or 3rd. However if they rule it as a fielders choice or a hit, there's a chance that the batter would be awarded an RBI.
>
> Review the repo.
>
> [repeated: the site-creation paragraph, the "Own the Outcome" paragraph, "Work line by line verifying from official verified trusted sources, provide links for manual review. There should be no manual input, work on your own to complete tasks. Flag any irregularities for review. No hallucinations.", "Verify no hallucinations", "The goal of this project is to get a full list that follow our requirements. No hallucinations. Verify line by line", "Go ahead and create a pull request and then merge the pull request onto the main. Make suggestions for what work still needs to be done and any limitations that is in the way of a successful project. It should be worked on in this next session or the next session. Work line by line verify everything no hallucinations.", and the three-pass instruction.]

**What this session did with that brief.** The three questions were researched against the
official record and the answers are in `docs/VERIFICATION.md` V22–V24:

1. *Can a pending scoring decision be predicted?* The marker exists only while a ruling is
   undecided, so no archive can hold it; the corpus is built by polling live games and is
   **still empty** (0 cases). The site says so rather than drawing smoothed bars over nothing.
2. *Can we tell if an error will be overturned into a fielder's choice or a hit?* Not from a
   replay — those are decided on the field. But the **Official Scorer** re-rules calls afterwards
   and MLB publishes every one, so the answer is now a real dataset: *Scorer decision changes*,
   classified from the official text with the source span quoted on every row.
3. *What happens to the batter's RBI?* The bulletin states it in the scorer's own words, and
   the classifier reads it. The brief's premise about second and third base is corrected against
   Rule 9.04 in section 1 below.

Two production defects were found and fixed along the way, both in `docs/VERIFICATION.md` V22
and V23: the harvest workflow had been **red on `main`** (an empty-live-slate bug plus two
non-hermetic tests), and 73% of the published overturn corpus turned out to be the automated
pitch challenge rather than a scoring decision.

### 0.3 Working rules this repo holds itself to

1. **Own the outcome.** If a data source is missing, fix or route around it and say so — do not
   wait to be asked. (This session: the sandbox cannot reach `*.mlb.com`, so the fetch moved to
   GitHub Actions, and the private `MLB-overturned-calls` repository is unreadable, so the list
   is rebuilt from the official feed instead of being copied.)
2. **Official sources only, with links.** Observed facts link to MLB/Statcast sources; derived
   values link to the method that produced them and are never styled as official MLB calls.
3. **No hallucinations.** If a fact cannot be pulled from a source it is left `null`, a range,
   or a labelled candidate — never guessed.
4. **Flag irregularities.** Everything odd found in the data goes into
   `data/site/harvest_meta.json` and `docs/VERIFICATION.md`.
5. **No manual input.** Harvest → train → publish are scripts in this repository, run on a
   schedule by GitHub Actions.

---

## 1. What this actually does

| Capability | Where | Honest status |
| --- | --- | --- |
| **Run-removing replay overturns, with a clip for every row** | `src/lsp/run_impact.py`, `scripts/harvest_reviews.py`, website → *Run-removed overturns* | **Arithmetic on the official record, for one clearly-stated case**: called a home run on the field, overturned by review, with the final event showing the homer was taken away. `runs_removed = (runners on base + 1 batter) − runs the final record credits`. Direction is read from the final event, never from the "(home run)" parenthetical, because the same wording covers reviews that *award* a home run — those are published separately with no count. Verified against three published values (gamePk 778307 = 2, 745857 = 2, 823616 = 1) which CI re-fetches on every run. Full three-season corpus (7,380 counting games): **22 plays, 28 runs removed**, plus 484 tiered candidates whose mechanism the archive cannot quantify. Published as a floor, not a census. |
| Overturns where a run *could* have changed but no number is derivable | same | **Labelled candidates, never a count.** The archived feed keeps only the corrected call, so a removed run leaves no trace; each row says so and links the clip. The 158 automated ball/strike challenges that were contaminating this list are **now removed from the committed data** (V23 / IRR-14): the review type is decoded against MLB's own registry, `DETECTION_VERSION` 3 re-derived every cached game, and the published count is **326 with 0 pitch-result rows**. |
| **Scorer decision changes: error → hit, hit → fielder's choice, and the RBI effect** | `src/lsp/decision_changes.py`, `scripts/harvest_decision_changes.py`, website → *Scorer decision changes* | **This is the brief's question, answered from MLB's own words.** MLB publishes every post-game scoring change; those entries say, in the scorer's own language, that a batter scored on an error was re-scored on a hit or a fielder's choice, and whether the batter's RBI moved. Each row is classified only when the official text states **both** sides, and the row quotes the exact span it was read from, so any claim can be checked by hand. Counts are tallies of published entries — **not** base rates and not probabilities. Verified entry by entry in V24. |
| **Pending official-scorer rulings** | `scripts/harvest_reviews.py`, `scripts/train_pending_model.py`, website → *Pending rulings* | Detection uses only the two registered event codes (`os_ruling_pending_primary`, `os_ruling_pending_prior`). Resolution distribution is published **with sample sizes and Wilson intervals**, and with a held-out-season comparison only when the data supports one. |
| Error plays with the Rule 9.04 facts (runs from 2nd/3rd, RBI credited) | `src/lsp/run_impact.py` (`error_credit`), `scripts/harvest_reviews.py` | **Collected from the official record.** The engine reports the facts; the RBI *judgment* stays with the scorer. |
| Estimate four batted-ball outcome probabilities; show a **Scoring Confidence Index (SCI)** | `src/lsp/scoring.py`, model in `models/` | **Experimental.** Committed holdout metrics are unconditional four-class metrics (502,352 train / 124,611 test, following season). Reached-only SCI calibration has **not** been regenerated (the raw training CSV is not in this checkout), and live inputs omit xBA/xwOBA/fielding-alignment features. The UI states both. |
| Correlation study | `scripts/analyze_correlations.py`, `docs/CORRELATIONS.md` | Point-biserial, Spearman, partial correlation, Cramér's V, mutual information. Association is not causation. |
| Official scorer statistical changes (hit/error, RBI, earned runs) | `src/lsp/scoring_changes.py` | MLB's prose listing, parsed; matching to a Stats API play is conservative. **Not** replay overturns and not scoreboard-run changes. |
| Observed API revisions | `src/lsp/watcher.py`, `scripts/watch.py` | Local before/after watcher; a score change is only co-observed evidence, never proof of causation. |
| Keep the feed current with no manual input | `.github/workflows/harvest.yml`, `.github/workflows/tests.yml` | Runs every 3 hours in season, bootstraps any missing season by itself, trains the pending model, commits the data and the docs. |

### The 0–100 question

For a play whose ruling is **pending**, the site shows the measured distribution of final
rulings for comparable pending cases (hit / error / fielder's choice / out) with `n` and a 95%
Wilson interval next to each bar. For a **completed** batted ball it shows the four-way model
probability, and for a reached-base ruling it shows SCI = the model's probability of the current
ruling renormalised over hit/error/fielder's choice, where `100 − SCI` is model disagreement and
**not** a measured probability that a scorer will change the call.

Both are base rates or model outputs with stated uncertainty. Neither is a promise about a
particular scorer, and the pages say so where they are shown.

**While the corpus is empty, the page says so instead of drawing bars.** A pending marker only
exists while a ruling is undecided, so the post-game harvest finds zero of them and the corpus is
built by polling live games. Until it has cases, the panel prints the reason in words; it will
not render a smoothed share over an empty sample as if it were a measured base rate (IRR-15).

### "Will this error be overturned into a hit or a fielder's choice?"

This is the sharpest question in the brief, and it now has a direct answer in the data — but not
the answer the project hoped for, so here is the distinction that matters:

* **A *replay* cannot tell you this.** An umpire's review is decided on the field in seconds. If
  an error stands after the play, it stands; the review record is not evidence about the scorer's
  later judgment.
* **The *Official Scorer* changes calls afterwards, and MLB publishes every one of them.** That
  is the *Scorer decision changes* view. Reading the 2026 bulletin (2026-09-29), the scorer's
  own reversals run in both directions: errors re-ruled as hits, hits re-ruled as errors, and
  hits re-ruled as fielder's choices. Several of those entries also state the RBI consequence —
  *"the RBI is removed for Stewart"*, *"Pasquantino gets no RBI"*, *"this now gives Young 1 RBI"*.
* **What this is not:** a base rate. MLB publishes a scoring change when one is made; the
  denominator of all plays is not on that page. The site says "count" everywhere, never "%".

So the answer to "can we tell in advance" is: not from a replay, and not yet from a model. What
this project can do today is show, from the official record, exactly which decisions get
re-ruled, in which direction, and what the batter's RBI became — and hand the reader the
sentence MLB published, so the claim can be checked rather than believed.

### The RBI rule, corrected

The brief assumed *"if the play is ruled an error the batter gets no RBI if there is a runner on
2nd or 3rd."* That is right for second base and **wrong for third**. Rule 9.04(a)(3) is
understood to provide an error exception when, before two are out, a runner from third
ordinarily would have scored. That is conditional: the runner must have started on third and the
Official Scorer must judge that the runner ordinarily would have scored. The live feed does not
always establish those facts, so `src/lsp/rbi.py` returns an RBI **range** instead of silently
crediting one. Rule 9.04(c) makes some fielder's-choice RBI calls judgment-dependent too. That
interpretation has **not** yet been audited line by line against the 2026 official Rule 9.04
section — see `docs/VERIFICATION.md` V6. Treat its output as experimental.

---

## 2. Run it

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
pytest -q                        # 180 offline tests; no network needed
node tests/site-smoke.mjs         # the site's renderers, against real, empty and missing payloads
```

The API and the original live UI (needs network access to `statsapi.mlb.com`):

```bash
uvicorn lsp.api:app --app-dir src --host 0.0.0.0 --port 8000   # -> http://localhost:8000
python scripts/watch.py --days-back 4 --interval 60            # Rule 9.01(a) revision window
```

The harvest that feeds the website (this is what CI runs; it needs a host that can reach
`*.mlb.com`):

```bash
python scripts/harvest_reviews.py --days-back 7 --workers 6 --verify-anchors --merge
python scripts/harvest_reviews.py --seasons 2024,2025,2026 --workers 6 --verify-anchors --merge
python scripts/train_pending_model.py
```

Serving the website locally:

```bash
python -m http.server 8000    # then open http://localhost:8000/ (index.html at the repo root)
```

Deeper verification utilities (need `statsapi.mlb.com`):

```bash
python scripts/verify_mirror.py --games 25     # mirror rows vs official play-by-play, field by field
python scripts/validate_rbi.py --days 3        # Rule 9.04 engine vs MLB's own RBI column
python scripts/train_pending_model.py --check  # the statistics, on built-in assertions
```

---

## 3. The website

Static site at the repository root (`index.html`, `assets/`), served by GitHub Pages with no
build step and no third-party requests. Six sections:

* **Run-removed overturns** — one row per play where a replay overturn took runs off the board:
  the arithmetic inputs, the clip, the official play-by-play, Gameday and Film Room links, plus a
  CSV download. Candidates (no derivable number) are listed separately with the reason.
* **Pending rulings** — a live panel that polls today's official feed in your browser for the
  registered pending codes, and the harvested distribution of what such rulings resolved to.
* **All replay overturns** — every completed overturned review the harvest found, filterable by
  season and review type. Read the type column: 73% of the corpus is the automated pitch-result
  challenge, not a scoring call (V23).
* **Scorer decision changes** — the official post-game scoring-change bulletin, each entry
  classified into the ruling it replaced and the ruling it became, with the RBI effect and the
  exact sentence span the classifier read.
* **Scoring model** — the model card, held-out metrics, the correlation study and the Rule 9.04
  RBI note.
* **Method & sources** — how each number is produced, the verification anchors and their results,
  coverage and irregularities, and every source link.

---

## 4. Sources

| What | URL | Used for |
| --- | --- | --- |
| MLB Stats API — schedule | https://statsapi.mlb.com/api/v1/schedule | Official game list, per-game official date |
| MLB Stats API — play-by-play | https://statsapi.mlb.com/api/v1/game/{gamePk}/playByPlay | Live rulings, reviews, pending codes, errors, `playId`s |
| MLB Stats API — event types | https://statsapi.mlb.com/api/v1/eventTypes | The only two "Official Scorer Ruling Pending" codes |
| MLB Stats API — review reasons | https://statsapi.mlb.com/api/v1/reviewReasons | Review code → description; also the only way to decode a `reviewType` whose description carries no parenthetical (V23) |
| Baseball Savant video | https://baseballsavant.mlb.com/sporty-videos?playId={playId} | Click-to-watch clip (verified 2026-09-28) |
| MLB Film Room | https://www.mlb.com/video/search?q=playid="{playId}" | Alternate video route |
| Official MLB Scoring Changes page | https://www.mlb.com/official-information/scoring-changes | The scorer's own hit/error/fielder's-choice reversals and their RBI effect, classified entry by entry (V24) |
| Official Baseball Rules (Rule 9) | https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf | Rules 9.01(a), 9.04, 9.05, 9.12 |
| Baseball Savant / Statcast | https://baseballsavant.mlb.com/statcast_search | Batted-ball features for the offline model |
| Statistical reference dataset | https://github.com/buffedlizard55-lab/MLB-overturned-calls | **Could not be read** (private / not visible to the build token) — see LIM-1 |

Full provenance and every verification performed: [`docs/VERIFICATION.md`](docs/VERIFICATION.md)
(checks V1–V15 with the URL to repeat each), [`docs/RUN_REMOVED.md`](docs/RUN_REMOVED.md) (the
generated clickable list), [`docs/PENDING_MODEL.md`](docs/PENDING_MODEL.md),
[`docs/METHODOLOGY.md`](docs/METHODOLOGY.md), [`docs/SOURCES.md`](docs/SOURCES.md),
[`docs/CORRELATIONS.md`](docs/CORRELATIONS.md), [`docs/PLAYS.md`](docs/PLAYS.md).

---

## 5. Known limitations (read before trusting a number)

* **LIM-1 — The referenced `MLB-overturned-calls` repository cannot be read from this
  environment.** `https://github.com/buffedlizard55-lab/MLB-overturned-calls` returns
  "Could not resolve to a Repository" for the build token, i.e. it is private or otherwise not
  visible to this integration. Nothing from it is assumed or copied. Its published counts
  (2024–2026: 87 plays, 93 runs) are recorded only as an external reference to compare against,
  and three of its plays are used as verification anchors for this pipeline. **The list on this
  site is not that list** — it is rebuilt from the official feed and covers whatever the harvest
  has scanned.
* **LIM-2 — Run removal is provable only for overturned home-run calls.** For every other
  overturn the archived feed retains just the corrected call, so a removed run is not derivable
  after the fact. Those rows are candidates with the reason printed.
* **LIM-3 — Non-replay run changes are a different mechanism.** An official scorer may remove a
  run through a statistical revision (Rule 9.01(a)) that never appears in `reviewDetails`. The
  site's list is replay-based; `src/lsp/scoring_changes.py` covers the statistical side
  separately.
* **LIM-4 — Pending-ruling rates are base rates.** They are conditioned only on facts visible
  while the ruling is pending. Batted-ball quality is not in that feed, home-park/official-scorer
  effects are not modelled, and a small slice falls back to the overall rate on purpose.
* **LIM-5 — SCI calibration is not in the committed metrics.** Existing metrics evaluate the
  four unconditional outcomes; reached-only calibration needs a retraining run on a connected
  host with the raw Statcast CSV.
* **LIM-6 — Live feature mismatch.** The offline model uses xBA, xwOBA and fielding-alignment
  inputs that the Stats API live normaliser does not populate, so live probabilities remain
  experimental and are labelled as such.
* **LIM-7 — This sandbox cannot reach `*.mlb.com`.** The Python client raises
  `SourceUnavailable` and the app falls back to the verified snapshot. All official fetching
  happens in GitHub Actions. Manual `workflow_dispatch` is not available to the build token
  (Actions write is not granted to this integration), so runs are driven by the `push` and
  `schedule` triggers.
* **LIM-8 — Clip availability is MLB's to decide.** Rows link to MLB's own Savant/Film Room
  pages; if MLB removes a clip the link will not resolve. Nothing is re-hosted here.
* **LIM-9 — Resolved in the committed data.** The 158 automated ball/strike challenges were
  removed from the detection rule and `DETECTION_VERSION` was bumped to 3. Harvest run
  `36613485309` re-derived every cached game and the committed payload now holds **326
  candidates with 0 pitch-result rows**, exactly the predicted correction from 484/158.
* **LIM-10 — A scoring change is not a base rate.** MLB publishes the post-game entries it
  chooses to publish. The counts on the *Scorer decision changes* view are tallies of those
  entries, and the denominator of all plays scored is not on that page. Nothing on that view may
  be read as "x% of errors are overturned".
* **LIM-11 — Resolved: the bulletin is now read whole.** The decision-change dataset was seeded
  with 23 hand-read entries on 2026-09-29, because the automated parser was matching only
  **2** of the page's entries. The page numbers its list with an HTML ordered list, so the
  published numbers are rendered by the browser and never appear in the page text; the parser
  was looking for a literal `001.` and only ever matched play notation that happened to end in
  a digit. It now reads the list items directly and uses each entry's position as its number.
  The committed payload holds **all 257 entries of the 2026 regular-season bulletin**, with
  **160 classified reversals**. A compressed copy of the live page is kept at
  `tests/fixtures/scoring_changes_page.html.gz` and a test parses it, so a future layout change
  fails the suite instead of quietly publishing two rows.
* **LIM-12 — The bulletin is one season deep, and its numbering is MLB's to change.** The page
  publishes the current season only, so entries from earlier seasons are kept from past captures
  and can never be re-read. A complete read replaces its own season and withdraws rows the page
  no longer shows (that is how the two malformed rows were removed); an entry MLB deletes or
  rewords shifts the numbers of every later entry. Rows keep `first_seen_utc` so a re-numbered
  entry is still traceable, and the view always shows the number MLB currently displays.

[`docs/ROADMAP.md`](docs/ROADMAP.md) turns each of these into next-session work in priority
order, with a definition of done for each item.

---

## 6. Repository layout

```
index.html, assets/     the GitHub Pages site (vanilla JS, no build step)
src/lsp/                features, model scoring, Rule 9.04 engine, reviews, run impact, watcher, API
  decision_changes.py   the scorer's own before/after rulings, read from MLB's scoring bulletin
  sources/              official-endpoint clients (Stats API)
scripts/                harvest_reviews, harvest_decision_changes, train_pending_model, harvest_statcast,
                        train_model, correlations, snapshot, watch, verify_mirror, validate_rbi,
                        analyze_correlations
.github/workflows/      harvest (scheduled, self-bootstrapping) and tests
data/reviews/           per-season harvest: reviews, run removals, pending cases, errors
data/site/              the compact payloads the website reads (+ the legacy snapshot)
models/                 the trained four-way model and the pending-ruling base rates
docs/                   RUN_REMOVED (generated), PENDING_MODEL (generated), VERIFICATION, SOURCES,
                        METHODOLOGY, CORRELATIONS, PLAYS, ROADMAP
tests/                  everything offline: rule engine, features, harvest, anchors, statistics
```

Data is © MLB Advanced Media, L.P. This project is not affiliated with or endorsed by MLB.
