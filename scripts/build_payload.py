#!/usr/bin/env python3
"""Build the published site payload from the harvested official-feed archives.

Inputs (written by scripts/harvest.py and scripts/harvest_scoring_changes.py):
  data/seasons/<season>.json        per-season MLB Stats API archive
  data/decision_changes.json        official scoring-change bulletin excerpts
  data/capture/pending_live.json    live pending-ruling capture (may be empty)
  data/flagged.json                 irregularities with official source links

Outputs (published by GitHub Pages):
  data/site/payload.json            everything except the long review list
  data/site/reviews-<season>.json   every overturned review for one season

No value is invented here. Counts are tallies of rows that the harvest wrote
from the official feed, and each row keeps the official URL it came from.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEASON_DIR = ROOT / "data" / "seasons"
SITE_DIR = ROOT / "data" / "site"

ROW_FIELDS = {
    "reviews": ("gamePk", "atBatIndex", "eventIndex", "season", "date", "teams", "batter", "pitcher",
                "reviewType", "reasonCode", "reason", "inning", "half", "event", "play", "playId",
                "pbp", "filmRoom", "savant", "source"),
    "runRemoved": ("gamePk", "atBatIndex", "season", "date", "teams", "batter", "pitcher", "reviewType",
                   "reasonCode", "reason", "inning", "half", "event", "play", "runnersOn", "runsCredited",
                   "runsRemoved", "arithmetic", "scoreDelta", "rbi", "playId", "pbp", "filmRoom",
                   "savant", "source", "clip"),
    "candidates": ("gamePk", "atBatIndex", "season", "date", "teams", "batter", "pitcher", "reviewType",
                   "reasonCode", "reason", "inning", "half", "event", "play", "runsCredited",
                   "noCountReason", "playId", "pbp", "filmRoom", "savant", "source"),
    "additions": ("gamePk", "atBatIndex", "season", "date", "teams", "batter", "pitcher", "reviewType",
                  "reasonCode", "reason", "inning", "half", "event", "play", "noCountReason",
                  "playId", "pbp", "filmRoom", "savant", "source"),
    "pitchChallenges": ("gamePk", "atBatIndex", "eventIndex", "season", "date", "teams", "batter", "pitcher",
                        "reviewType", "reasonCode", "reason", "inning", "half", "event", "play",
                        "pbp", "filmRoom", "source"),
}

ANCHOR_GAMES = {823616, 778307, 745857}


def load_json(path: Path, default):
    if not path.is_file():
        return default
    return json.loads(path.read_text())


def trim(row: dict, fields: tuple[str, ...]) -> dict:
    out = {field: row.get(field) for field in fields}
    # The client shows `clip`; it is the official Savant page for the feed's play id.
    if out.get("clip") is None and out.get("savant"):
        out["clip"] = out["savant"]
    return out


def sort_key(row: dict):
    return (row.get("date") or "", -(row.get("atBatIndex") or 0))


def main() -> int:
    SITE_DIR.mkdir(parents=True, exist_ok=True)

    season_files = sorted(SEASON_DIR.glob("*.json"))
    seasons = [json.loads(path.read_text()) for path in season_files]
    seasons.sort(key=lambda item: item["season"])

    reviews_all: list[dict] = []
    pitch_all: list[dict] = []
    removals: list[dict] = []
    additions: list[dict] = []
    candidates: list[dict] = []
    pending_rows: list[dict] = []
    iregular: list[dict] = []
    scale: list[dict] = []
    unreconciled: dict[str, dict] = {}

    for archive in seasons:
        season = archive["season"]
        reviews = [trim(row, ROW_FIELDS["reviews"]) for row in archive.get("reviews", [])]
        pitch = [trim(row, ROW_FIELDS["pitchChallenges"]) for row in archive.get("pitchChallenges", [])]
        removals.extend(trim(row, ROW_FIELDS["runRemoved"]) for row in archive.get("runRemoved", []))
        additions.extend(trim(row, ROW_FIELDS["additions"]) for row in archive.get("additions", []))
        candidates.extend(trim(row, ROW_FIELDS["candidates"]) for row in archive.get("candidates", []))
        pending_rows.extend(archive.get("pending", []))
        unreconciled.update(archive.get("checks", {}).get("unreconciledGames", {}))

        reviews_all.extend(reviews)
        pitch_all.extend(pitch)

        published = [trim(row, ROW_FIELDS["runRemoved"]) for row in archive.get("runRemoved", [])]
        # Only the overturned reviews are published as rows: the pitch-challenge
        # archive is large (thousands of rows) and is reported as a count here,
        # while reviews.html reads a date's pitch challenges live from MLB.
        (SITE_DIR / f"reviews-{season}.json").write_text(
            json.dumps({"season": season, "generatedAt": archive.get("generatedAt"),
                        "source": archive.get("source"), "reviews": reviews,
                        "pitchChallengeCount": len(pitch)}, indent=1, ensure_ascii=False) + "\n")

        scale.append({
            "season": season,
            "gamesCompleted": archive.get("games", {}).get("completed"),
            "gamesScanned": archive.get("games", {}).get("scanned"),
            "feedsUnavailable": len(archive.get("games", {}).get("failed") or []),
            "overturnedReviews": len(reviews),
            "pitchChallenges": len(pitch),
            "runRemovals": len(published),
            "runsRemoved": sum(row.get("runsRemoved") or 0 for row in published),
            "candidates": len(archive.get("candidates", [])),
            "additions": len(archive.get("additions", [])),
            "source": archive.get("source"),
        })

        if archive.get("games", {}).get("failed"):
            iregular.append({
                "id": f"IRR-FEED-{season}",
                "text": (f"{len(archive['games']['failed'])} of {archive['games']['completed']} {season}"
                         " official game feeds could not be read during the harvest; those games are not"
                         " counted in any total. Re-runnable with `python3 scripts/harvest.py --season"
                         f" {season} --force`."),
                "source": f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate={season}-03-01&endDate={season}-11-30",
                "unverified": True,
            })

    if unreconciled:
        iregular.append({
            "id": "IRR-RECONCILE",
            "text": (f"{len(unreconciled)} game(s) did not reconcile their tracked runs with the official"
                     " final score. Any run-removal row from those games was downgraded to a candidate with"
                     " no count. Game ids: " + ", ".join(sorted(unreconciled)[:40])),
            "source": "https://statsapi.mlb.com/api/v1/game/823616/playByPlay",
            "unverified": True,
        })

    removals.sort(key=sort_key, reverse=True)
    additions.sort(key=sort_key, reverse=True)
    candidates.sort(key=sort_key, reverse=True)

    decisions_doc = load_json(ROOT / "data" / "decision_changes.json", {"entries": []})
    decisions = decisions_doc.get("entries") if isinstance(decisions_doc, dict) else decisions_doc

    capture = load_json(ROOT / "data" / "capture" / "pending_live.json", {"cases": []})
    captured = capture.get("cases") or []

    pending_cases: list[dict] = []
    seen = set()
    for row in captured + pending_rows:
        key = (row.get("gamePk"), row.get("atBatIndex"))
        if key in seen:
            continue
        seen.add(key)
        pending_cases.append(row)

    flagged = load_json(ROOT / "data" / "flagged.json", {"items": []})
    irregularities = []
    for item in flagged.get("items", []):
        irregularities.append({
            "id": item.get("id"),
            "text": item.get("description"),
            "source": item.get("source_url"),
            "status": item.get("status"),
            "unverified": item.get("status") != "verified_reference",
        })
    irregularities.extend(iregular)

    anchors = []
    for game_pk in sorted(ANCHOR_GAMES):
        published = next((row for row in removals if row.get("gamePk") == game_pk), None)
        anchors.append({
            "gamePk": game_pk,
            "atBatIndex": published.get("atBatIndex") if published else None,
            "runsRemoved": published.get("runsRemoved") if published else None,
            "status": ("Re-derived from the official play-by-play by scripts/harvest.py; "
                       "arithmetic and runner movements agree with the printed official score."
                       if published else
                       "No completed review on the field was overturned from a home run to a non-home-run"
                       " result in this game's official record, so no run-removal count is published."),
            "pbp": f"https://statsapi.mlb.com/api/v1/game/{game_pk}/playByPlay",
        })
    for anchor in anchors:
        published = next((row for row in removals if row.get("gamePk") == anchor["gamePk"]), None)
        if published:
            anchor["clip"] = published.get("savant")
            anchor["filmRoom"] = published.get("filmRoom")

    total_removed = sum(row.get("runsRemoved") or 0 for row in removals)
    games_scanned = sum(item["gamesScanned"] or 0 for item in scale)
    games_completed = sum(item["gamesCompleted"] or 0 for item in scale)
    season_label = f"{scale[0]['season']}–{scale[-1]['season']}" if scale else "no season"
    review_series = [
        {"season": item["season"], "url": f"data/site/reviews-{item['season']}.json",
         "count": item["overturnedReviews"], "pitchCount": item["pitchChallenges"]}
        for item in reversed(scale)
    ]

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "seasons": [item["season"] for item in scale],
        "run_removed": removals,
        "additions": additions,
        "candidates": candidates,
        "reviews": [],
        "reviewSeries": review_series,
        "decisions": decisions,
        "scorer": [],
        "pending": {
            "distribution": [],
            "cases": pending_cases,
            "note": (f"Detection uses only the two registered codes from MLB's event-type registry."
                     f" {len(pending_cases)} case(s) are on file from the archived feeds and the live"
                     " capture. The archive normally replaces the marker with the corrected call, so the"
                     " only complete record is the browser's live view and the capture workflow."),
            "source": "https://statsapi.mlb.com/api/v1/eventTypes",
        },
        "model": load_json(ROOT / "data" / "model_meta.json", {}),
        "correlations": [],
        "anchors": anchors,
        "meta": {
            "coverage": {
                "games": f"{games_scanned} of {games_completed} completed regular-season and postseason games scanned ({season_label}).",
                "run-removals": f"{len(removals)} plays, {total_removed} runs removed, derived by stated arithmetic on the official record.",
                "all-replay-overturns": f"{len(reviews_all)} overturned reviews on file; {len(pitch_all)} automated pitch challenges are counted separately.",
                "pending-rulings": f"{len(pending_cases)} pending official-scorer cases on file; the live panel reads today's feeds in your browser.",
                "scorer-decision-changes": f"{len(decisions)} bulletin entries on file, each with the exact span it was read from.",
                "scoring-model": "The original model, training data and holdout metrics were not part of the upload and are not reconstructed here.",
            },
            "seasonScale": scale,
            "freshness": f"Official-feed harvest completed {payload_time()}.",
            "irregularities": irregularities,
        },
    }

    (SITE_DIR / "payload.json").write_text(
        json.dumps(payload, indent=1, ensure_ascii=False) + "\n")

    size = (SITE_DIR / "payload.json").stat().st_size
    print(f"payload.json: {size/1024:.0f} KiB, {len(removals)} run-removals, {len(candidates)} candidates,"
          f" {len(decisions)} bulletin entries, {len(pending_cases)} pending cases")
    for item in review_series:
        path = SITE_DIR / f"reviews-{item['season']}.json"
        print(f"  {path.name}: {path.stat().st_size/1024:.0f} KiB, {item['count']} overturns,"
              f" {item['pitchCount']} pitch challenges")
    return 0


def payload_time() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


if __name__ == "__main__":
    raise SystemExit(main())
