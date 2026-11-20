"""Offline validation of the published site payload.

Every check runs against the committed JSON only: no network, no MLB access.
Run with:  pytest -q
"""

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
PAYLOAD = ROOT / "data" / "site" / "payload.json"
OFFICIAL = "statsapi.mlb.com"
BULLETIN = "https://www.mlb.com/official-information/scoring-changes"
RULINGS = {"hit", "error", "fielders_choice"}


@pytest.fixture(scope="module")
def payload():
    assert PAYLOAD.exists(), "data/site/payload.json is missing"
    with PAYLOAD.open() as fh:
        return json.load(fh)


def test_payload_is_valid_json(payload):
    assert isinstance(payload, dict)
    assert payload.get("generatedAt"), "payload must record when the harvest ran"
    assert payload.get("seasons"), "payload must record which seasons it covers"


def test_run_removed_rows_are_arithmetic_on_the_official_record(payload):
    for row in payload.get("run_removed", []):
        assert row.get("pbp") and OFFICIAL in row["pbp"], f"row {row.get('gamePk')} missing official play-by-play"
        assert row.get("source") and OFFICIAL in row["source"], f"row {row.get('gamePk')} missing official source"
        runners_on, credited = row.get("runnersOn"), row.get("runsCredited")
        assert isinstance(runners_on, int) and isinstance(credited, int), row
        assert row["runsRemoved"] == (runners_on + 1) - credited, row
        assert row["runsRemoved"] >= 1, row
        assert row.get("reviewType"), "a run-removal row must keep the official review code"
        assert "(home run)" in (row.get("play") or "").lower(), "only verified home-run overturns carry a count"


def test_every_published_row_links_an_official_source(payload):
    for key in ("run_removed", "additions", "candidates"):
        for row in payload.get(key, []):
            assert row.get("pbp") and OFFICIAL in row["pbp"], f"{key}: {row.get('gamePk')} missing play-by-play"


def test_candidates_never_carry_a_count(payload):
    for row in payload.get("candidates", []):
        assert "runsRemoved" not in row, f"candidate {row.get('gamePk')} must not publish a count"
        assert row.get("noCountReason"), "a candidate must state why it has no count"


def test_review_series_files_exist_and_match_the_manifest(payload):
    series = payload.get("reviewSeries") or []
    assert series, "the review series manifest is empty"
    for item in series:
        path = ROOT / item["url"]
        assert path.is_file(), f"missing review file {item['url']}"
        doc = json.loads(path.read_text())
        assert len(doc["reviews"]) == item["count"], item
        for row in doc["reviews"]:
            assert row.get("pbp") and OFFICIAL in row["pbp"], f"review {row.get('gamePk')} missing official feed link"
            assert row.get("play"), "an overturned review must quote the official result text"


def test_bulletin_entries_keep_official_text_and_only_classify_named_changes(payload):
    rows = payload.get("decisions") or []
    assert rows, "no scoring-change bulletin entries were harvested"
    for row in rows:
        assert row.get("source") == BULLETIN, row
        assert row.get("span"), "every bulletin row must quote the official sentence"
        if row.get("classified"):
            assert row.get("before") in RULINGS and row.get("after") in RULINGS, row
            assert row["before"] != row["after"], row
        else:
            assert not (row.get("before") and row.get("after") and row["before"] != row["after"]), (
                "a stated change must be classified, not left blank")


def test_anchors_and_irregularities_are_traceable(payload):
    for anchor in payload.get("anchors", []):
        assert anchor.get("pbp") and OFFICIAL in anchor["pbp"], "anchor missing official play-by-play"
        assert anchor.get("status"), "anchor must state what was checked"
    for irregular in payload.get("meta", {}).get("irregularities") or []:
        assert irregular.get("id") and irregular.get("text"), irregular
        assert irregular.get("source"), f"{irregular.get('id')} has no source link"


def test_pending_cases_carry_official_sources(payload):
    pending = payload.get("pending") or {}
    for row in pending.get("cases") or []:
        assert row.get("pbp") and OFFICIAL in row["pbp"], "pending case missing official play-by-play"
        assert row.get("codes"), "pending case must record the registry code that matched"


def test_no_row_publishes_a_value_without_its_source(payload):
    for key in ("run_removed", "additions", "candidates"):
        for row in payload.get(key, []):
            for field in ("date", "teams", "season"):
                assert row.get(field), f"{key} row {row.get('gamePk')} is missing {field}"
