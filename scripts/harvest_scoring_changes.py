#!/usr/bin/env python3
"""Harvest MLB's official post-game scoring-change bulletin.

Source (official): https://www.mlb.com/official-information/scoring-changes

The page lists every scoring change MLB publishes, one numbered entry per change,
grouped under a season heading. Each entry keeps the official text verbatim; the
before/after call is filled in only when the official sentence names both sides
of the change, using the deterministic rules below. Everything else is left
blank and counted as unclassified — never guessed.

Classification rules (applied to the official sentence, in this order):
  * Split the sentence at "instead of" / "rather than" into two clauses.
  * The clause containing the word "now" describes the corrected call ("after");
    the other clause describes the original call ("before"). If exactly one
    clause contains "now" is not true, the entry stays unclassified.
  * A clause counts as fielder's choice when it contains "fielder" and "choice";
    as an error when it contains "error"; as a hit when it contains "single",
    "double", "triple" or "home run". A clause matching more than one of those
    (for example "fielder's choice error charged to") stays unclassified.
  * The row is published as a classified reversal only when both clauses classify
    and the two calls differ.
  * A second official wording is also read: "the <hit> for <player> has been changed
    to an error" (and its fielder's-choice variant) states the original call and the
    corrected call explicitly, so it yields the same before/after pair.
  * RBI effect is published only when the official sentence states it ("loses an
    RBI", "gets no RBI", "gains an RBI", "credited with an RBI"); the exact
    sentence is quoted so it can be checked by hand.
"""

from __future__ import annotations

import html
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "decision_changes.json"
URL = "https://www.mlb.com/official-information/scoring-changes"

ENTRY = re.compile(r"<li>\s*(?:<p>)?(.*?)(?:</p>)?\s*</li>", re.S)
SEASON_HEADER = re.compile(r"<strong>\s*((?:19|20)\d{2})\s+(Regular Season|Postseason|Spring Training)\s*</strong>")
PREFIX = re.compile(r"^\s*(\d{1,2}/\d{1,2})\s+([A-Z0-9@]+)\s*--\s*(.+)$", re.S)
SPLITTERS = (" instead of ", " rather than ", ", instead of ")
CHANGED_TO = re.compile(
    r"the (single|double|triple|home run) for (?P<who>[^,]+?) (?:has|have) been changed to"
    r" (?:an |a )?(error|fielders'? choice)", re.I)


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; LiveScoringErrors-Pending harvest)"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8", "replace")


def plain(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", "", fragment)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def classify_clause(clause: str) -> str | None:
    lowered = clause.lower()
    hits = "fielder" in lowered and "choice" in lowered
    error = "error" in lowered
    hit = any(word in lowered for word in ("single", "double", "triple", "home run"))
    matches = [name for name, flag in
               (("fielders_choice", hits), ("error", error), ("hit", hit)) if flag]
    return matches[0] if len(matches) == 1 else None


def rbi_effect(text: str) -> tuple[bool | None, str | None, str | None]:
    lowered = text.lower()
    for phrase, label in (
        ("loses an rbi", "Loses an RBI"),
        ("lose an rbi", "Loses an RBI"),
        ("gets no rbi", "No RBI credited"),
        ("no rbi", "No RBI credited"),
        ("gains an rbi", "Gains an RBI"),
        ("credited with an rbi", "Gains an RBI"),
        ("awarded an rbi", "Gains an RBI"),
    ):
        if phrase in lowered:
            sentence = next((part.strip() for part in re.split(r"(?<=\.)\s+", text)
                             if phrase in part.lower()), None)
            return True, label, sentence
    return None, None, None


def split_sides(text: str) -> tuple[str | None, str | None]:
    for splitter in SPLITTERS:
        if splitter in text.lower():
            index = text.lower().index(splitter)
            first = text[:index].strip(" ,.")
            second = text[index + len(splitter):].strip(" ,.")
            first_now = re.search(r"\bnow\b", first, re.I) is not None
            second_now = re.search(r"\bnow\b", second, re.I) is not None
            if first_now == second_now:
                return None, None
            return (first, second) if first_now else (second, first)
    return None, None


def parse(html_text: str) -> list[dict]:
    # A season heading precedes each numbered list; track the heading as we walk.
    entries: list[dict] = []
    position = 0
    current_season = None
    current_kind = None
    for match in SEASON_HEADER.finditer(html_text):
        start = match.start()
        block = html_text[position:start]
        entries.extend(collect(block, current_season, current_kind))
        current_season, current_kind = match.group(1), match.group(2)
        position = match.end()
    entries.extend(collect(html_text[position:], current_season, current_kind))
    return entries


def collect(block: str, season: str | None, kind: str | None) -> list[dict]:
    rows: list[dict] = []
    counter = 0
    for raw in ENTRY.findall(block):
        text = plain(raw)
        prefix = PREFIX.match(text)
        if not prefix:
            continue
        counter += 1
        date, game, body = prefix.group(1), prefix.group(2), prefix.group(3).strip()
        after_clause, before_clause = split_sides(body)
        before = classify_clause(before_clause) if before_clause else None
        after = classify_clause(after_clause) if after_clause else None
        changed = CHANGED_TO.search(body)
        if changed:
            before = classify_clause(changed.group(1))
            after = classify_clause(changed.group(3))
        changed, effect, quote = rbi_effect(body)
        rows.append({
            "season": season,
            "kind": kind,
            "entryNo": f"{counter:03d}",
            "date": date,
            "game": game,
            "before": before,
            "after": after,
            "classified": bool(before and after and before != after),
            "rbiChanged": changed,
            "rbiEffect": effect,
            "rbiQuote": quote,
            "span": body,
            "source": URL,
        })
    return rows


def main() -> int:
    page = fetch(URL)
    rows = parse(page)
    classified = [row for row in rows if row["classified"]]
    with_rbi = [row for row in rows if row["rbiChanged"]]
    OUT.write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": URL,
        "rule": ("before/after published only when the official sentence names both sides of the"
                 " change with a single ruling; otherwise left blank and counted as unclassified"),
        "entries": rows,
    }, indent=1, ensure_ascii=False) + "\n")
    print(f"bulletin: {len(rows)} entries, {len(classified)} classified reversals,"
          f" {len(with_rbi)} with an RBI statement -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
