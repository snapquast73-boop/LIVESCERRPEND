#!/usr/bin/env python3
"""Harvest official MLB Stats API feeds into a per-season archive.

Everything published by the site is written by this script from MLB's own
`statsapi.mlb.com` endpoints. Nothing is typed by hand, estimated, or filled in
to make a table look complete: a value is either read from the feed, derived by
the stated arithmetic below, or left out and flagged.

Sources (official MLB Stats API, no key required):
  schedule   https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=..&endDate=..
  play-by-play https://statsapi.mlb.com/api/v1/game/{gamePk}/playByPlay
  registries https://statsapi.mlb.com/api/v1/eventTypes
             https://statsapi.mlb.com/api/v1/reviewReasons

Derived quantities
------------------
runs removed = (runners on base + 1 batter) - runs the final record credits
  Published only for a completed review whose own text says the call on the
  field was a home run and that the call was overturned, when the corrected
  result is not a home run. Base occupancy is tracked play by play from the
  official runner movements; every tracked run is cross-checked against the
  official score printed on each play, and the game total against the official
  final score. If any of those checks fails the row is downgraded to a
  candidate with no count instead of being published as a number.

Usage
-----
  python3 scripts/harvest.py --season 2026 [--max-games N] [--force]
  python3 scripts/harvest.py --season 2026 --season 2025
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

API = "https://statsapi.mlb.com/api/v1"
ROOT = Path(__file__).resolve().parents[1]
SEASON_DIR = ROOT / "data" / "seasons"
CACHE_DIR = ROOT / "data" / "cache"
TIMEOUT = 30
RETRIES = 3
THREADS = 12

# Counting games only: regular season, Wild Card, Division, LCS, World Series.
COUNTING_GAME_TYPES = {"R", "F", "D", "L", "W"}

PENDING_CODES = {"os_ruling_pending_primary", "os_ruling_pending_prior"}

# Review reason codes that can put a run on the board (from /reviewReasons).
RUN_AFFECTING_REASONS = {
    "H",   # Home run
    "A",   # Tag play
    "B",   # Touching a base
    "C",   # Force play
    "N",   # Fan interference
    "P",   # Home-plate collision
    "U",   # Tag-up play
    "E",   # Slide interference
    "G",   # Grounds rule
    "M",   # Timing Play
    "Q",   # Rules check
    "Y",   # Runner placement
}
PITCH_REASONS = {"J", "I", "Z"}  # Pitch result, Hit by pitch, Check swing


def log(message: str) -> None:
    print(message, flush=True)


def get_json(url: str, allow_cache: bool = False):
    """GET a JSON document from the official feed, with retries."""
    cache = CACHE_DIR / (url.replace("https://", "").replace("/", "_")[:200] + ".json")
    if allow_cache and cache.is_file():
        try:
            return json.loads(cache.read_text())
        except json.JSONDecodeError:
            pass
    last = None
    for attempt in range(RETRIES):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "LiveScoringErrors-Pending harvest"})
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                if response.status != 200:
                    raise urllib.error.HTTPError(url, response.status, "unexpected status", response.headers, None)
                data = json.load(response)
            if allow_cache:
                cache.parent.mkdir(parents=True, exist_ok=True)
                cache.write_text(json.dumps(data))
            return data
        except Exception as error:  # noqa: BLE001 - retried below
            last = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed {url}: {last}")


def schedule_url(season: str) -> str:
    return (f"{API}/schedule?sportId=1&startDate={season}-03-01&endDate={season}-11-30"
            f"&fields=dates,date,games,gamePk,officialDate,season,gameType,status,abstractGameState,"
            f"codedGameState,detailedState,teams,away,home,team,id,name,score,isWinner,venue")


def season_games(season: str) -> list[dict]:
    data = get_json(schedule_url(season), allow_cache=True)
    games: dict[int, dict] = {}
    for day in data.get("dates") or []:
        for game in day.get("games") or []:
            if game.get("gameType") not in COUNTING_GAME_TYPES:
                continue
            if game.get("status", {}).get("abstractGameState") != "Final":
                continue
            game.setdefault("officialDate", day.get("date"))
            games[int(game["gamePk"])] = game
    return [games[key] for key in sorted(games)]


def team_names(game: dict) -> str:
    away = (game.get("teams", {}).get("away", {}).get("team") or {}).get("name")
    home = (game.get("teams", {}).get("home", {}).get("team") or {}).get("name")
    return f"{away} @ {home}" if away and home else (away or home or "")


def review_reason_map() -> dict[str, str]:
    data = get_json(f"{API}/reviewReasons", allow_cache=True)
    return {row["code"]: row["description"] for row in data if row.get("code")}


def review_reason(review_type: str | None, registry: dict[str, str]) -> tuple[str | None, str | None]:
    """Split a review code into (reason_code, reason_text) using MLB's registry.

    The feed prints codes such as ``NH`` or ``MJ``. The reason codes published by
    /reviewReasons are one or two letters, so a two-letter feed code is matched by
    taking the longest suffix that exists in the registry. The leading letter is
    the review initiator, which MLB does not publish in that registry; it is
    reported as part of the raw code and never described here.
    """
    if not review_type:
        return None, None
    for size in (2, 1):
        candidate = review_type[-size:]
        if candidate in registry:
            return candidate, registry[candidate]
    return None, None


def is_pitch_review(review_type: str | None, registry: dict[str, str]) -> bool:
    reason, _ = review_reason(review_type, registry)
    return review_type == "MJ" or reason in PITCH_REASONS


def play_by_play_url(game_pk: int) -> str:
    return f"{API}/game/{game_pk}/playByPlay"


def film_room_url(game_pk: int) -> str:
    return f"https://www.mlb.com/video/game/{game_pk}"


def savant_url(play_id: str | None) -> str | None:
    return f"https://baseballsavant.mlb.com/sporty-videos?playId={play_id}" if play_id else None


def batter_name(play: dict) -> str | None:
    return ((play.get("matchup") or {}).get("batter") or {}).get("fullName")


def pitcher_name(play: dict) -> str | None:
    return ((play.get("matchup") or {}).get("pitcher") or {}).get("fullName")


def runner_name(runner: dict) -> str | None:
    return ((runner.get("details") or {}).get("runner") or {}).get("fullName")


def play_play_id(play: dict) -> str | None:
    events = play.get("playEvents") or []
    for event in reversed(events):
        if event.get("playId"):
            return event["playId"]
    return None


def apply_play(play: dict, bases: dict[str, str]) -> dict:
    """Advance the tracked base state through one play and report what happened.

    Returns the occupancy counted before the play, the runners recorded as
    scoring, and any inconsistency found between those movements and the official
    score printed on the play.
    """
    before = dict(bases)
    scored: list[str] = []
    flagged_scoring: list[str] = []
    for runner in play.get("runners") or []:
        movement = runner.get("movement") or {}
        details = runner.get("details") or {}
        name = runner_name(runner)
        start = movement.get("start")
        end = movement.get("end")
        out_base = movement.get("outBase")
        if start in bases:
            bases.pop(start, None)
        if end == "score":
            scored.append(name or "unknown")
        elif end in {"1B", "2B", "3B"}:
            bases[end] = name or "unknown"
        if out_base:
            bases.pop(out_base, None)
        if details.get("isScoringEvent"):
            flagged_scoring.append(name or "unknown")
    return {"before": before, "scored": scored, "flagged": flagged_scoring}


def score_delta(play: dict, is_top: bool, previous: tuple[int, int]) -> tuple[int, tuple[int, int]]:
    result = play.get("result") or {}
    away = result.get("awayScore")
    home = result.get("homeScore")
    if not isinstance(away, int) or not isinstance(home, int):
        return 0, previous
    delta = (away - previous[0]) if is_top else (home - previous[1])
    return max(delta, 0), (away, home)


def review_rows_for_game(feed: dict, game: dict, registry: dict[str, str]) -> dict:
    """Walk one game's play-by-play and collect reviews, run-removals and candidates."""
    game_pk = int(game["gamePk"])
    rows: list[dict] = []
    base_issues: list[str] = []
    bases: dict[str, str] = {}
    scores = (0, 0)
    tracked_runs = {"away": 0, "home": 0}
    tracking_issue: str | None = None
    previous_half = None

    for play in feed.get("allPlays") or []:
        about = play.get("about") or {}
        result = play.get("result") or {}
        is_top = bool(about.get("isTopInning"))

        # A half inning always starts with empty bases. Clearing here is a rule of
        # baseball, not an assumption about the feed: it stops a runner left on base
        # at the end of one half inning leaking into the next play's occupancy.
        half = (about.get("inning"), about.get("halfInning"))
        if previous_half is not None and half != previous_half:
            bases.clear()
        previous_half = half

        state = apply_play(play, bases)
        delta, scores = score_delta(play, is_top, scores)
        tracked_runs["away" if is_top else "home"] += len(state["scored"])
        if delta != len(state["scored"]):
            issue = (f"play {about.get('atBatIndex')}: official score moved {delta} run(s) but"
                     f" {len(state['scored'])} runner(s) are recorded scoring")
            base_issues.append(issue)
            tracking_issue = tracking_issue or issue

        review = play.get("reviewDetails")
        events = play.get("playEvents") or []
        event_reviews = [(event.get("index"), event.get("reviewDetails")) for event in events
                         if event.get("reviewDetails")]

        if review and review.get("isOverturned") is True and review.get("inProgress") is False:
            rows.append({
                "gamePk": game_pk,
                "atBatIndex": about.get("atBatIndex"),
                "eventIndex": None,
                "season": str(game.get("season") or game.get("officialDate", "")[:4]),
                "date": game.get("officialDate"),
                "teams": team_names(game),
                "batter": batter_name(play),
                "pitcher": pitcher_name(play),
                "reviewType": review.get("reviewType"),
                "inning": about.get("inning"),
                "half": about.get("halfInning"),
                "event": result.get("eventType"),
                "play": result.get("description"),
                "rbi": result.get("rbi"),
                "awayScore": result.get("awayScore"),
                "homeScore": result.get("homeScore"),
                "runnersOn": len(state["before"]),
                "basesBefore": "".join(sorted(state["before"].keys())) or None,
                "runsCredited": len(state["scored"]),
                "scoreDelta": delta,
                "playId": play_play_id(play),
                "pbp": play_by_play_url(game_pk),
                "filmRoom": film_room_url(game_pk),
                "savant": savant_url(play_play_id(play)),
                "source": play_by_play_url(game_pk),
                "trackingIssue": tracking_issue,
            })
        for index, event_review in event_reviews:
            if event_review.get("isOverturned") is not True or event_review.get("inProgress") is not False:
                continue
            rows.append({
                "gamePk": game_pk,
                "atBatIndex": about.get("atBatIndex"),
                "eventIndex": index,
                "season": str(game.get("season") or game.get("officialDate", "")[:4]),
                "date": game.get("officialDate"),
                "teams": team_names(game),
                "batter": batter_name(play),
                "pitcher": pitcher_name(play),
                "reviewType": event_review.get("reviewType"),
                "inning": about.get("inning"),
                "half": about.get("halfInning"),
                "event": result.get("eventType"),
                "play": result.get("description"),
                "rbi": result.get("rbi"),
                "awayScore": result.get("awayScore"),
                "homeScore": result.get("homeScore"),
                "runnersOn": len(state["before"]),
                "basesBefore": "".join(sorted(state["before"].keys())) or None,
                "runsCredited": len(state["scored"]),
                "scoreDelta": delta,
                "playId": None,
                "pbp": play_by_play_url(game_pk),
                "filmRoom": film_room_url(game_pk),
                "savant": None,
                "source": play_by_play_url(game_pk),
                "trackingIssue": tracking_issue,
            })

    final_away = (game.get("teams", {}).get("away") or {}).get("score")
    final_home = (game.get("teams", {}).get("home") or {}).get("score")
    checks = {
        "officialFinal": {"away": final_away, "home": final_home},
        "trackedRuns": dict(tracked_runs),
        "scoreConsistent": (final_away == tracked_runs["away"] and final_home == tracked_runs["home"]),
        "issues": base_issues,
    }
    return {"rows": rows, "checks": checks}


def classify(rows: list[dict], registry: dict[str, str]) -> dict:
    reviews, pitch, removals, additions, candidates = [], [], [], [], []
    home_run_review = {}
    for row in rows:
        review_type = row.get("reviewType")
        reason, reason_text = review_reason(review_type, registry)
        row["reasonCode"] = reason
        row["reason"] = reason_text
        text = row.get("play") or ""
        names_home_run = "(home run)" in text.lower()
        awarded_home_run = (row.get("event") or "").endswith("home_run")

        if is_pitch_review(review_type, registry):
            pitch.append(row)
            continue

        reviews.append(row)

        if not names_home_run:
            if reason in RUN_AFFECTING_REASONS and (row.get("runsCredited") or 0) > 0:
                candidates.append(dict(row, noCountReason=(
                    "A run crossed on this play, but the archived feed keeps only the corrected call,"
                    " so the pre-review state needed for a count is not in the record.")))
            continue

        if awarded_home_run:
            additions.append(dict(row, noCountReason=(
                "The review awarded a home run; the pre-review state is not kept in the archived feed,"
                " so no count is published.")))
            continue

        # Called a home run on the field, overturned, and the corrected result is not
        # a home run: runs removed is arithmetic on the official record.
        runners_on = row.get("runnersOn")
        credited = row.get("runsCredited")
        if row.get("trackingIssue") or runners_on is None or credited is None:
            candidates.append(dict(row, noCountReason="Base occupancy could not be verified from the feed."))
            continue
        removed = (runners_on + 1) - credited
        if removed < 1:
            candidates.append(dict(row, noCountReason=(
                f"Arithmetic gives {removed} run(s) removed, so no removal is claimed.")))
            continue
        removals.append(dict(row, runsRemoved=removed,
                             arithmetic=f"({runners_on} + 1) - {credited} = {removed}"))
    return {
        "reviews": reviews,
        "pitchChallenges": pitch,
        "runRemoved": removals,
        "additions": additions,
        "candidates": candidates,
    }


def pending_rows(feed: dict, game: dict) -> list[dict]:
    rows = []
    for play in feed.get("allPlays") or []:
        marks = []
        result = play.get("result") or {}
        if result.get("eventType") in PENDING_CODES:
            marks.append(result.get("eventType"))
        for event in play.get("playEvents") or []:
            code = (event.get("details") or {}).get("eventType")
            if code in PENDING_CODES:
                marks.append(code)
        for runner in play.get("runners") or []:
            code = (runner.get("details") or {}).get("eventType")
            if code in PENDING_CODES:
                marks.append(code)
        if not marks:
            continue
        about = play.get("about") or {}
        rows.append({
            "gamePk": int(game["gamePk"]),
            "atBatIndex": about.get("atBatIndex"),
            "season": str(game.get("season") or ""),
            "date": game.get("officialDate"),
            "teams": team_names(game),
            "batter": batter_name(play),
            "codes": sorted(set(marks)),
            "play": result.get("description"),
            "pbp": play_by_play_url(int(game["gamePk"])),
            "source": f"{API}/eventTypes",
        })
    return rows


def harvest_season(season: str, max_games: int | None = None) -> dict:
    registry = review_reason_map()
    games = season_games(season)
    if max_games:
        games = games[:max_games]
    log(f"{season}: {len(games)} completed counting games in the official schedule")

    results: list[dict] = []
    failures: list[int] = []

    def work(game: dict) -> None:
        game_pk = int(game["gamePk"])
        try:
            feed = get_json(play_by_play_url(game_pk))
            if not isinstance(feed.get("allPlays"), list):
                raise RuntimeError("unexpected play-by-play shape")
            results.append({"game": game, "feed": feed})
        except Exception as error:  # noqa: BLE001 - recorded as a failure
            failures.append(game_pk)
            log(f"  feed unavailable {game_pk}: {error}")

    with ThreadPoolExecutor(max_workers=THREADS) as pool:
        list(pool.map(work, games))

    results.sort(key=lambda item: int(item["game"]["gamePk"]))

    reviews: list[dict] = []
    pitch: list[dict] = []
    removals: list[dict] = []
    additions: list[dict] = []
    candidates: list[dict] = []
    pending: list[dict] = []
    game_checks: dict[str, dict] = {}

    for item in results:
        game, feed = item["game"], item["feed"]
        parsed = review_rows_for_game(feed, game, registry)
        classes = classify(parsed["rows"], registry)
        if not parsed["checks"]["scoreConsistent"]:
            for key in ("runRemoved",):
                for row in classes[key]:
                    downgraded = dict(row)
                    downgraded.pop("runsRemoved", None)
                    downgraded.pop("arithmetic", None)
                    downgraded["noCountReason"] = (
                        "The game's tracked runs do not reconcile with the official final score,"
                        " so no count is published.")
                    classes["candidates"].append(downgraded)
            classes["runRemoved"] = []
        if parsed["checks"]["issues"]:
            game_checks[str(game["gamePk"])] = parsed["checks"]
        reviews.extend(classes["reviews"])
        pitch.extend(classes["pitchChallenges"])
        removals.extend(classes["runRemoved"])
        additions.extend(classes["additions"])
        candidates.extend(classes["candidates"])
        pending.extend(pending_rows(feed, game))

    return {
        "season": season,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": schedule_url(season),
        "games": {
            "completed": len(games),
            "scanned": len(results),
            "failed": failures,
        },
        "reviews": reviews,
        "pitchChallenges": pitch,
        "runRemoved": removals,
        "additions": additions,
        "candidates": candidates,
        "pending": pending,
        "checks": {
            "unreconciledGames": game_checks,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--season", action="append", required=True, help="season year, repeatable")
    parser.add_argument("--max-games", type=int, default=None, help="debug limit per season")
    parser.add_argument("--force", action="store_true", help="re-harvest a season already on disk")
    args = parser.parse_args()

    SEASON_DIR.mkdir(parents=True, exist_ok=True)
    for season in args.season:
        target = SEASON_DIR / f"{season}.json"
        if target.is_file() and not args.force and not args.max_games:
            log(f"{season}: {target.name} already present, skipped (use --force to rebuild)")
            continue
        archive = harvest_season(season, args.max_games)
        target.write_text(json.dumps(archive, indent=1, ensure_ascii=False) + "\n")
        log(f"{season}: {archive['games']['scanned']}/{archive['games']['completed']} games scanned,"
            f" {len(archive['reviews'])} overturns, {len(archive['runRemoved'])} run-removals,"
            f" {len(archive['candidates'])} candidates, {len(archive['pending'])} pending rows -> {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
