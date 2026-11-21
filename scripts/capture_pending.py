#!/usr/bin/env python3
"""Capture official-scorer pending rulings while a game is in progress.

The archived play-by-play replaces the pending marker with the corrected call as
soon as the scorer rules, so a post-game harvest can only ever see the survivors.
This script is run by `.github/workflows/live-capture.yml` during game hours: it
polls the official schedule for games in progress, records every pending marker
it sees, and — when the same play later carries a ruling — records what it
resolved to.

Only the two registered event codes count (MLB /api/v1/eventTypes):
  os_ruling_pending_primary, os_ruling_pending_prior
Nothing is estimated: a case with no observed resolution stays unresolved.
"""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://statsapi.mlb.com/api/v1"
ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "data" / "capture" / "pending_live.json"
PENDING = {"os_ruling_pending_primary", "os_ruling_pending_prior"}


def get_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": "LiveScoringErrors-Pending capture"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def eastern_today() -> str:
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("America/New_York")).date().isoformat()
    except Exception:  # noqa: BLE001 - tz database may be absent
        offset = timezone(timedelta(hours=-4))
        return datetime.now(offset).date().isoformat()


def pending_codes(play: dict) -> list[str]:
    marks = []
    if (play.get("result") or {}).get("eventType") in PENDING:
        marks.append(play["result"]["eventType"])
    for event in play.get("playEvents") or []:
        code = (event.get("details") or {}).get("eventType")
        if code in PENDING:
            marks.append(code)
    for runner in play.get("runners") or []:
        code = (runner.get("details") or {}).get("eventType")
        if code in PENDING:
            marks.append(code)
    return sorted(set(marks))


def main() -> int:
    store = json.loads(STORE.read_text()) if STORE.is_file() else {"cases": []}
    cases = {f"{case['gamePk']}/{case['atBatIndex']}": case for case in store.get("cases", [])}
    date = eastern_today()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    schedule = get_json(f"{API}/schedule?sportId=1&date={date}")
    games = [game for day in schedule.get("dates") or [] for game in day.get("games") or []]
    live = [game for game in games if game.get("status", {}).get("abstractGameState") in {"Live", "Final"}]

    added = 0
    resolved = 0
    for game in live:
        game_pk = int(game["gamePk"])
        try:
            feed = get_json(f"{API}/game/{game_pk}/playByPlay")
        except Exception as error:  # noqa: BLE001 - a single bad feed must not stop the capture
            print(f"feed unavailable {game_pk}: {error}")
            continue
        teams = "{} @ {}".format(
            ((game.get("teams", {}).get("away") or {}).get("team") or {}).get("name", "?"),
            ((game.get("teams", {}).get("home") or {}).get("team") or {}).get("name", "?"))
        for play in feed.get("allPlays") or []:
            key = f"{game_pk}/{play.get('atBatIndex')}"
            codes = pending_codes(play)
            if codes:
                case = cases.get(key)
                if case is None:
                    cases[key] = {
                        "gamePk": game_pk,
                        "atBatIndex": play.get("atBatIndex"),
                        "season": str(game.get("season") or date[:4]),
                        "date": game.get("officialDate") or date,
                        "teams": teams,
                        "batter": ((play.get("matchup") or {}).get("batter") or {}).get("fullName"),
                        "codes": codes,
                        "play": (play.get("result") or {}).get("description"),
                        "first_seen": now,
                        "last_seen": now,
                        "resolvedTo": None,
                        "pbp": f"{API}/game/{game_pk}/playByPlay",
                        "source": f"{API}/eventTypes",
                    }
                    added += 1
                else:
                    case["last_seen"] = now
                continue
            case = cases.get(key)
            if case and not case.get("resolvedTo"):
                event = (play.get("result") or {}).get("eventType")
                if event:
                    case["resolvedTo"] = event
                    case["resolvedDescription"] = (play.get("result") or {}).get("description")
                    case["resolved_seen"] = now
                    resolved += 1

    ordered = sorted(cases.values(), key=lambda case: (case.get("date") or "", case.get("gamePk") or 0,
                                                       case.get("atBatIndex") or 0))
    STORE.parent.mkdir(parents=True, exist_ok=True)
    STORE.write_text(json.dumps({
        "generated_at": now,
        "source": f"{API}/eventTypes",
        "date": date,
        "note": ("Pending official-scorer rulings observed in live feeds. A case keeps when it was first"
                 " and last seen and what the same play later resolved to. Nothing is inferred."),
        "cases": ordered,
    }, indent=1, ensure_ascii=False) + "\n")
    print(f"{date}: {len(live)} live/final game(s) checked, {added} new case(s), {resolved} resolution(s),"
          f" {len(ordered)} case(s) on file")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
