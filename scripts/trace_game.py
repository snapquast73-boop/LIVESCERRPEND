#!/usr/bin/env python3
"""Diagnostic: print the base-state trace for one game (development helper).

Fetches the official play-by-play and prints, play by play, the tracked occupancy,
every runner movement and any half-inning boundary the harvest sees. Used to check
the tracker against a known game; it writes no site data.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("harvest", ROOT / "scripts" / "harvest.py")
harvest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harvest)


def trace(game_pk: int) -> None:
    feed = harvest.get_json(harvest.play_by_play_url(game_pk))
    plays = feed["allPlays"]
    bases: dict[str, str] = {}
    previous_half = None
    print(f"=== game {game_pk}: {len(plays)} plays ===")
    for play in plays:
        about = play.get("about") or {}
        result = play.get("result") or {}
        half = (about.get("inning"), about.get("halfInning"))
        boundary = ""
        if half[0] is None or half[1] is None:
            boundary = f"  <-- MISSING half/inn {half}"
        elif previous_half is not None and half != previous_half:
            bases.clear()
            boundary = f"  <-- inning boundary {previous_half} -> {half}"
            previous_half = half
        else:
            previous_half = half
        if half[0] and half[1] and previous_half != half:
            previous_half = half
        before = dict(bases)
        state = harvest.apply_play(play, bases)
        movements = []
        for runner in play.get("runners") or []:
            movement = runner.get("movement") or {}
            movements.append(f"{(runner.get('details') or {}).get('runner', {}).get('fullName')}:"
                             f"{movement.get('start')}->{movement.get('end')}"
                             f"{'/out@' + movement['outBase'] if movement.get('outBase') else ''}")
        flag = "  <<< " + "; ".join(state["unoccupied"]) if state["unoccupied"] else ""
        print(f"[{play.get('atBatIndex'):>3}] inn{half[0]}{str(half[1])[:1]} {result.get('eventType'):<28}"
              f" bases={sorted(before)} -> {sorted(bases)} | {' '.join(movements)}{boundary}{flag}")


def sample(date: str) -> None:
    """Trace every game on one official date and summarise the tracker's issues."""
    schedule = harvest.get_json(harvest.schedule_url(date[:4]) if False else
                                f"{harvest.API}/schedule?sportId=1&date={date}")
    games = [game for day in schedule.get("dates") or [] for game in day.get("games") or []
             if game.get("status", {}).get("abstractGameState") == "Final"]
    total = 0
    clean = 0
    for game in games:
        feed = harvest.get_json(harvest.play_by_play_url(int(game["gamePk"])))
        parsed = harvest.review_rows_for_game(feed, game, {})
        issues = parsed["checks"]["issues"]
        total += len(issues)
        clean += 0 if issues else 1
        print(f"{game['gamePk']} {date}: {len(issues)} issue(s)"
              + ("".join(f"\n    {issue}" for issue in issues[:3])))
    print(f"SUMMARY {date}: {len(games)} games, {clean} clean, {total} issue(s)")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--sample":
        for arg in args[1:]:
            sample(arg)
    else:
        for pk in args or ["823616"]:
            trace(int(pk))
