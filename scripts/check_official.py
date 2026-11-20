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


def main():
    payload = json.loads((ROOT / 'data/site/payload.json').read_text())
    for row in payload['reviews'] + payload['run_removed'] + payload['candidates']:
        gid = row['gamePk']
        schedule = json.loads(read(f'https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk={gid}'))
        game, = [g for day in schedule['dates'] for g in day['games'] if g['gamePk'] == gid]
        assert (row['date'], row['season']) == (game['officialDate'], game['season']), gid
        assert row['teams'] == ' @ '.join(game['teams'][side]['team']['name'] for side in ('away', 'home')), gid
        plays = json.loads(read(row['pbp']))['allPlays']
        idx = row['atBatIndex']
        play, = [p for p in plays if p['atBatIndex'] == idx]
        review = play['reviewDetails']
        assert review['isOverturned'] is True and review['inProgress'] is False, (gid, idx)
        assert row['reviewType'] == review['reviewType'] and row['play'] == play['result']['description'], (gid, idx)
        assert row['batter'] == play['matchup']['batter']['fullName'], gid
        for key, actual in [('pitcher', play['matchup']['pitcher']['fullName']), ('inning', play['about']['inning']), ('event', play['result']['event'])]:
            if key in row:
                assert row[key] == actual, (gid, key)
        if 'runsCredited' in row:
            prev, = [p for p in plays if p['atBatIndex'] == idx - 1]
            score = 'awayScore' if play['about']['isTopInning'] else 'homeScore'
            assert row['runsCredited'] == play['result'][score] - prev['result'][score], gid
        if 'runnersOn' in row:
            # Count distinct players already on a base, not movement records or the batter.
            runners = {r['details']['runner']['id'] for r in play['runners'] if r['movement'].get('start')}
            assert row['runnersOn'] == len(runners), gid
        print(f"Checked game {gid}, play {idx}: {row['pbp']}")
    for row in payload['decisions']:
        text = VisibleText(read(row['source'])).normalized()
        assert f"{row['date']} -- {row['span']}" in text, row['entryNo']
        print(f"Checked {row['season']} excerpt {row['entryNo']}: {row['source']}")


if __name__ == '__main__':
    main()
