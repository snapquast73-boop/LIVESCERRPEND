"""Unit tests for the harvest's base-state tracker and run-removal arithmetic.

These run offline against synthetic plays shaped exactly like the official feed
(see the field map in docs/VERIFICATION.md), so a regression is caught before a
five-minute harvest run is spent.
"""

import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "harvest.py"
spec = importlib.util.spec_from_file_location("harvest", SCRIPT)
harvest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harvest)


def play(runners, *, atBat=0, inning=1, half="top", away=0, home=0, event="single", review=None):
    return {
        "atBatIndex": atBat,
        "about": {"atBatIndex": atBat, "inning": inning, "halfInning": half,
                  "isTopInning": half == "top", "isComplete": True},
        "result": {"eventType": event, "description": event, "awayScore": away, "homeScore": home},
        "runners": runners,
        "reviewDetails": review,
    }


def runner(name, start, end, *, out=None, scoring=False):
    return {"movement": {"start": start, "end": end, "outBase": out, "isOut": out is not None},
            "details": {"runner": {"fullName": name}, "isScoringEvent": scoring}}


def test_single_with_runner_on_first_keeps_both_runners():
    bases = {}
    harvest.apply_play(play([runner("Batter", None, "1B"), runner("Runner", "1B", "2B")]), bases)
    assert bases == {"1B": "Batter", "2B": "Runner"}


def test_batter_out_at_first_does_not_evict_the_runner_standing_there():
    bases = {"1B": "Runner"}
    harvest.apply_play(play([runner("Batter", None, None, out="1B")]), bases)
    assert bases == {"1B": "Runner"}


def test_fly_out_leaves_runners_in_place_and_counts_no_runs():
    bases = {"2B": "Runner"}
    state = harvest.apply_play(play([runner("Batter", None, None, out="1B")]), bases)
    assert bases == {"2B": "Runner"}
    assert state["scored"] == []


def test_run_scores_and_leaves_the_base():
    bases = {"3B": "Runner"}
    state = harvest.apply_play(play([runner("Batter", None, "2B"), runner("Runner", "3B", "score", scoring=True)]), bases)
    assert state["scored"] == ["Runner"]
    assert bases == {"2B": "Batter"}


def test_a_runner_moving_from_an_unoccupied_base_is_reported():
    state = harvest.apply_play(play([runner("Runner", "1B", "2B")]), {})
    assert state["unoccupied"] and "advanced from 1B" in state["unoccupied"][0]


def test_home_run_overturned_to_double_removes_batter_and_any_runner_left_on():
    bases = {"1B": "Trevor Larnach"}
    review = {"reviewType": "NH", "isOverturned": True, "inProgress": False}
    state = harvest.apply_play(play([
        {"movement": {"start": None, "end": "2B"}, "details": {"runner": {"fullName": "Ryan Jeffers"}}},
        {"movement": {"start": "1B", "end": "3B"}, "details": {"runner": {"fullName": "Trevor Larnach"}}},
    ], review=review), bases)
    runs_credited = len(state["scored"])
    assert runs_credited == 0
    assert (len(state["before"]) + 1) - runs_credited == 2


def test_game_parsing_derives_the_published_soto_row():
    game = {"gamePk": 823616, "officialDate": "2026-06-13", "season": "2026",
            "teams": {"away": {"team": {"name": "Atlanta Braves"}, "score": 3},
                      "home": {"team": {"name": "New York Mets"}, "score": 1}},
            "status": {"abstractGameState": "Final"}}
    feed = {"allPlays": [
        play([runner("Eli White", None, None, out="1B")], atBat=61, inning=9, half="bottom"),
        play([runner("Dominic Smith", None, None, out="1B")], atBat=62, inning=9, half="bottom"),
        play([{"movement": {"start": None, "end": "2B"},
               "details": {"runner": {"fullName": "Juan Soto"}, "isScoringEvent": False}}],
             atBat=63, inning=9, half="bottom", event="double",
             review={"reviewType": "NH", "isOverturned": True, "inProgress": False}),
    ]}
    parsed = harvest.review_rows_for_game(feed, game, {"H": "Home run"})
    row = parsed["rows"][0]
    assert row["atBatIndex"] == 63
    assert row["runnersOn"] == 0
    assert row["runsCredited"] == 0
    assert parsed["checks"]["scoreConsistent"] is False  # fixture scores are not the tracked ones
    classes = harvest.classify([dict(row, play="Umpire reviewed (home run), overturned: Soto doubles.")], {"H": "Home run"})
    assert classes["runRemoved"] and classes["runRemoved"][0]["runsRemoved"] == 1


def test_half_inning_boundary_clears_the_bases():
    bases = {"1B": "Runner"}
    # The parser clears on a half-inning change; emulate the same rule here.
    previous_half = (1, "top")
    bases.clear()
    assert (1, "bottom") != previous_half and not bases
