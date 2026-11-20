"""Offline validation of the site snapshot payload.

No network required. Run with:  pytest -q
"""

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
PAYLOAD = ROOT / "data" / "site" / "payload.json"


@pytest.fixture
def payload():
    assert PAYLOAD.exists(), "data/site/payload.json is missing"
    with PAYLOAD.open() as fh:
        return json.load(fh)


def test_payload_is_valid_json(payload):
    assert isinstance(payload, dict)


def test_run_removed_rows_carry_official_source(payload):
    for row in payload.get("run_removed", []):
        assert row.get("source"), f"row {row.get('gamePk')} missing source"
        assert row.get("pbp"), f"row {row.get('gamePk')} missing official play-by-play link"
        assert "statsapi.mlb.com" in row["pbp"], f"row {row.get('gamePk')} source not official MLB"


def test_anchors_carry_official_links(payload):
    for a in payload.get("anchors", []):
        assert a.get("pbp"), "anchor missing official play-by-play link"
        assert "statsapi.mlb.com" in a["pbp"], "anchor source not official MLB"


def test_irregularities_are_flagged(payload):
    for irr in (payload.get("meta", {}).get("irregularities") or []):
        assert irr.get("id"), "irregularity missing id"
        assert irr.get("text"), "irregularity missing text"


def test_reviewed_run_totals_match_independent_evidence(payload):
    assert len(payload["run_removed"]) == 1
    row = payload["run_removed"][0]
    assert (row["gamePk"], row["atBatIndex"]) == (823616, 63)
    assert row["runsRemoved"] == row["runnersOn"] + 1 - row["runsCredited"]
    assert row["source"] == row["clip"]
    assert all(a["runsRemoved"] is None for a in payload["anchors"] if a["gamePk"] != 823616)
    assert all(row["runsRemoved"] is None for row in payload["candidates"])


def test_bulletin_excerpts_distinguish_missing_rbi_from_no_rbi(payload):
    rows = payload["decisions"]
    assert rows and all(row["source"] == "https://www.mlb.com/official-information/scoring-changes" for row in rows)
    assert sum(row["rbiChanged"] is True for row in rows) == 1
    assert all(row["rbiEffect"] is None for row in rows if row["rbiChanged"] is None)
