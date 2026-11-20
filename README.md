# LiveScoringErrors-Pending

**GitHub Pages:** <https://snapquast73-boop.github.io/LIVESCERRPEND/>
**Audit and limitations:** [Flagged for Review](https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html)

This is a static restoration of an incomplete upload. The original HTML structure and sections are retained where possible; the absent styling and browser code were rebuilt. There is no build step, API key, server-side app, or data setup. GitHub Pages publishes the repository root from `main` ([GitHub publishing documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)).

- **Run-removed overturns:** a verified sample with an explicit candidate state, season/search filters, official clips and CSV export.
- **Pending rulings:** direct checks of the current Eastern Time schedule while the tab is open. Only [MLB’s two registered event codes](https://statsapi.mlb.com/api/v1/eventTypes) count as pending. Unavailable feeds are reported separately from an empty result.
- **All replay overturns:** the [reviews entry point](https://snapquast73-boop.github.io/LIVESCERRPEND/reviews.html) opens today’s lookup automatically. Browse the local sample plus scans of a date’s eligible game feeds from the [MLB schedule](https://statsapi.mlb.com/api/v1/schedule?sportId=1). Review codes are displayed as reported, with each row linking to its game’s official play-by-play.
- **Scorer decision changes:** a filterable sample of the [official MLB scoring-change bulletin](https://www.mlb.com/official-information/scoring-changes), with blank RBI values when not stated.
- **Live scorer and model:** completed balls in play show MLB’s reported ruling and RBI, with date lookup, filters and CSV. The original predictive model, calibration and correlation study were not included. No synthetic scores or substitute estimates are published.

The [uploaded README](https://github.com/snapquast73-boop/LIVESCERRPEND/blob/aa23dc5a24ed10040741c8dd1838a0db28646f3e/README.md) is available in Git history. Its historical totals and references to the absent Python app and pipeline describe upstream claims, not verified functionality in this checkout. `requirements.txt` and `conftest.py` are legacy files and are not needed to run or test the restored site.

## Run and test

```sh
python3 -m http.server 8000
# Open http://localhost:8000/ in a browser; file:// does not load JS modules and JSON reliably.
```

```sh
node --test tests/mlb.test.mjs
python3 tests/check_site.py
```

The local sample and navigation work without MLB network access. A live or historical scan requires the visitor’s browser to be able to reach the public MLB Stats API. See [COORDINATION.md](COORDINATION.md) for the audit and deployment record.

Data © MLB Advanced Media, L.P. This project is not affiliated with or endorsed by MLB. Videos remain on MLB’s own sites.
