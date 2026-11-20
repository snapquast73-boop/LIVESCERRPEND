# Verification

Every published number is checked against the official MLB record it came from. This page records
how, what the checks found, and what is still open. The published copy is
<https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html>.

Run the checks yourself:

```sh
python3 -m pytest -q            # payload invariants, bulletin rules, harvest logic
node --test tests/mlb.test.mjs  # official-feed parsing
python3 tests/check_site.py     # pages, ids, ARIA targets, local links
node tests/site-smoke.mjs       # renders the real pages against the real payload (jsdom)
```

## What the harvest covers (payload generated 2026-11-20)

| Season | Games completed | Games scanned | Feeds unavailable | Overturned reviews | Pitch challenges | Run removals | Runs removed | Candidates | No-count additions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2024 | 2,473 | 2,473 | 0 | 644 | 49 | 9 | 11 | 41 | 10 |
| 2025 | 2,477 | 2,477 | 0 | 661 | 40 | 8 | 9 | 44 | 11 |
| 2026 | 2,470 | 2,470 | 0 | 663 | 5,865 | 6 | 6 | 44 | 10 |
| **Total** | **7,420** | **7,420** | **0** | **1,968** | **5,954** | **23** | **26** | **129** | **31** |

Sources per season are recorded in `meta.seasonScale[].source` in
`data/site/payload.json` — each is the official
`/api/v1/schedule?sportId=1&startDate=<season>-03-01&endDate=<season>-11-30` request the harvest made.

## The three anchors, re-derived on every run

These are the games the uploaded README named. All three reproduce from the official play-by-play.

| Game | Date | Batter | Runs on base + batter | Runs credited after the review | Runs removed | Official record |
| --- | --- | --- | --- | --- | --- | --- |
| [823616](https://statsapi.mlb.com/api/v1/game/823616/playByPlay) | 2026-06-13 | Juan Soto | 0 + 1 | 0 | **1** | home run overturned to a double, batter to second, nobody on base |
| [778307](https://statsapi.mlb.com/api/v1/game/778307/playByPlay) | 2025-04-15 | Ryan Jeffers | 1 (Larnach on 1B) + 1 | 0 | **2** | Larnach to third, no run scored |
| [745857](https://statsapi.mlb.com/api/v1/game/745857/playByPlay) | 2024-09-11 | Royce Lewis | 3 (Vázquez 3B, Farmer 2B, Santana 1B) + 1 | 2 | **2** | Vázquez and Farmer score, Santana to third |

Each row was read directly from the official feed on 2026-11-20 and compared with the number the site
publishes. Example, game 745857 `atBatIndex` 63: the feed lists
`Christian Vázquez 3B → score`, `Kyle Farmer 2B → score`, `Carlos Santana 1B → 3B`,
`Royce Lewis (batter) → 2B`, with `isScoringEvent: true` on exactly the two scoring movements — so
`(3 + 1) − 2 = 2`. The uploaded README's claim of 2 for this game is therefore reproduced, not
copied.

## How a run-removal row is allowed to exist

A row is published only when **all** of these are true:

1. the play's own text contains `(home run)` — the on-field call was a home run;
2. `reviewDetails.isOverturned` is `true` and `inProgress` is `false`;
3. the corrected `result.eventType` is not `home_run` (a home run that stood is a scored run, not a removed one);
4. base occupancy at the start of the play is tracked from every official runner movement, and
5. the counted runs reconcile: every play's tracked runs must equal the score printed on that play,
   and the game total must equal the official final score.

Rule 4 and 5 are enforced as an invariant. Three defects were found in the tracker during this
session and fixed; each one is covered by a unit test in `tests/test_harvest_logic.py`:

- a runner left on base at the end of a half inning leaked into the next half inning;
- a batter thrown out at first (`outBase: "1B"`) evicted a runner standing on first;
- a runner's advance split into segments inside one play (reaching second on the hit, third on the
  throw) was applied out of order, and baserunners were matched by printed name rather than by MLB
  person id.

After the fixes, all 7,420 games reconcile (0 games in `checks.unreconciledGames` for every season).
The site also counts the extra-inning automatic runner from the feed
(`checks.automaticRunners`), instead of reporting it as untracked base occupancy.

## Bulletin rules

`scripts/harvest_scoring_changes.py` reads MLB's official scoring-change page. Of 255 published
entries for the 2026 season, **63** state both sides of a change in one sentence and are classified
(error ↔ hit, fielder's choice ↔ hit); **192** do not, are left blank and are counted as
unclassified. **17** entries state an RBI effect and quote the sentence that states it. The official
sentence is printed on every row, so a revision by MLB can be seen rather than hidden.

## Review codes

The feed prints composite codes (`NH`, `MJ`, `MF`). MLB's
[review-reason registry](https://statsapi.mlb.com/api/v1/reviewReasons) publishes one- and
two-letter codes, so the site names the reason only when the code's suffix exists in that registry,
and prints the raw code either way. The leading letter — the review initiator — is not described
because MLB does not publish it there.

## Open items

Published on the [Flagged for Review page](https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html),
sourced from `data/flagged.json`:

| Id | Area | Status |
| --- | --- | --- |
| FLAG-01 | Repository upload was incomplete (client, data and scripts rebuilt here) | fixed |
| FLAG-02 | Upstream repositories return 404; nothing copied, no claim treated as evidence | unverified |
| FLAG-03 | Uploaded README totals vs the harvest (23 plays / 26 runs / 129 candidates) | needs review |
| FLAG-04 | Composite review codes and the unpublished initiator letter | needs review |
| FLAG-05 | No pending ruling survives in an archived feed | unverified |
| FLAG-06 | Scoring model, SCI and correlation study are absent | unverified |
| FLAG-07 | Bulletin is current-season only; 192 entries unclassified | needs review |
| FLAG-08 | Clip links are official pages, not re-hosted video | needs review |
| FLAG-09 | Harvest scope: which game types are in the archive | needs review |
