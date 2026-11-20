# Verification

The [published audit](https://snapquast73-boop.github.io/LIVESCERRPEND/flagged-for-review.html) gives a field-by-field source record of the sampled rows, missing fields, and known coverage limits. The original imported claims remain in [the upload’s Git history](https://github.com/snapquast73-boop/LIVESCERRPEND/blob/aa23dc5a24ed10040741c8dd1838a0db28646f3e/README.md).

Reproduce the offline checks with `pytest -q`, `node --test tests/mlb.test.mjs` (Node 22+) and `python3 tests/check_site.py`.
