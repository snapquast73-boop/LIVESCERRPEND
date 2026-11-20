"""Online drift check for the published sample. Does not extrapolate or rewrite data."""
import json
import time
from functools import cache
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


@cache
def read(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'LIVESCERRPEND-source-audit/1.0'}), timeout=30) as response:
                return response.read().decode('utf-8')
        except OSError:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


class VisibleText(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.parts = []
        self.skip = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip = True

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = False

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

    def normalized(self):
        return ' '.join(' '.join(self.parts).split())


def every(rows, step):
    """A deterministic sample that always includes the first and last row."""
    if len(rows) <= step:
        return list(rows)
    picked = rows[::step]
    if rows[-1] not in picked:
        picked.append(rows[-1])
    return picked


def series_rows():
    """Overturned reviews live in one file per season; read them all."""
    rows = []
    for name in sorted((ROOT / 'data/site').glob('reviews-*.json')):
        rows.extend(json.loads(name.read_text())['reviews'])
    return rows


def check_game_rows(rows):
    for row in rows:
        gid = row['gamePk']
        schedule = json.loads(read(f'https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk={gid}'))
        # A suspended or resumed game can be listed on more than one date; the first
        # entry is the official record for the gamePk, and the row is checked against it.
        matches = [g for day in schedule['dates'] for g in day['games'] if g['gamePk'] == gid]
        assert matches, f"{gid}: the official schedule has no game with this gamePk"
        game = matches[0]
        assert (row['date'], str(row['season'])) == (game['officialDate'], str(game['season'])), gid
        assert row['teams'] == ' @ '.join(game['teams'][side]['team']['name'] for side in ('away', 'home')), gid
        plays = json.loads(read(row['pbp']))['allPlays']
        idx = row['atBatIndex']
        play, = [p for p in plays if p['atBatIndex'] == idx]
        # A review can sit on the play or on one of its pitch events; the row records
        # which one with `eventIndex`, so the same record is looked up either way.
        index = row.get('eventIndex')
        if index is None:
            review = play.get('reviewDetails')
            result_text = play['result']['description']
        else:
            event, = [e for e in play['playEvents'] if e.get('index') == index]
            review = event.get('reviewDetails')
            result_text = (event.get('details') or {}).get('description') or play['result']['description']
        assert review, f"{gid}/{idx}: the official feed has no review record at this position"
        assert review['isOverturned'] is True and review['inProgress'] is False, (gid, idx)
        assert row['reviewType'] == review['reviewType'], (gid, idx)
        assert row['play'] == result_text, (gid, idx)
        assert row['batter'] == play['matchup']['batter']['fullName'], gid
        for key, actual in [('pitcher', play['matchup']['pitcher']['fullName']),
                            ('inning', play['about']['inning']),
                            ('event', play['result']['eventType'])]:
            if row.get(key) is not None:
                assert row[key] == actual, (gid, key)
        if row.get('runsCredited') is not None:
            prev, = [p for p in plays if p['atBatIndex'] == idx - 1]
            score = 'awayScore' if play['about']['isTopInning'] else 'homeScore'
            delta = play['result'][score] - prev['result'][score]
            assert row['runsCredited'] == delta, gid
        if row.get('runnersOn') is not None:
            # Distinct players already on a base, not movement records and not the batter.
            runners = {r['details']['runner']['id'] for r in play['runners'] if r['movement'].get('start')}
            assert row['runnersOn'] == len(runners), (gid, row['runnersOn'], len(runners))
        if row.get('runsRemoved') is not None:
            assert row['runsRemoved'] == (row['runnersOn'] + 1) - row['runsCredited'], (gid, row['runsRemoved'])
        print(f"Checked game {gid}, play {idx}: {row['pbp']}")


def main():
    payload = json.loads((ROOT / 'data/site/payload.json').read_text())
    removals = payload['run_removed']
    reviews = series_rows()
    candidates = payload['candidates']

    print(f"run removals: all {len(removals)} rows")
    check_game_rows(removals)
    print(f"overturned reviews: {len(reviews)} rows on file, checking a sample")
    check_game_rows(every(reviews, 60))
    print(f"candidates: {len(candidates)} rows on file, checking a sample")
    check_game_rows(every(candidates, 40))

    bulletin = VisibleText(read(payload['decisions'][0]['source'])).normalized() if payload['decisions'] else ''
    for row in payload['decisions']:
        expected = f"{row['date']} {row['game']} -- {row['span']}" if row.get('game') \
            else f"{row['date']} -- {row['span']}"
        assert expected in bulletin, row['entryNo']
    print(f"bulletin: all {len(payload['decisions'])} entries matched the official text")


if __name__ == '__main__':
    main()
