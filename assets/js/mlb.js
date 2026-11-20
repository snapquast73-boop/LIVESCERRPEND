const api = 'https://statsapi.mlb.com/api/v1';
export const playByPlay = id => `${api}/game/${id}/playByPlay`;
export const scheduleFor = date => `${api}/schedule?sportId=1&date=${encodeURIComponent(date)}`;
export const pendingCodes = new Set(['os_ruling_pending_primary', 'os_ruling_pending_prior']);
const safeId = id => Number.isSafeInteger(id) && id > 0;

export function easternDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now).map(({type, value}) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function readJSON(url, request = fetch) {
  const response = await request(url, {signal: AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function scanDate(date, liveOnly, request = fetch) {
  const schedule = await readJSON(scheduleFor(date), request);
  if (!Array.isArray(schedule.dates) || schedule.dates.some(day => !Array.isArray(day.games))) {
    throw new Error('Unexpected MLB schedule format');
  }
  const games = schedule.dates.flatMap(day => day.games)
    .filter(game => safeId(game.gamePk) && (liveOnly
      ? game.status?.abstractGameState === 'Live'
      : ['Live', 'Final'].includes(game.status?.abstractGameState)));
  const feeds = [];
  const failed = [];
  // Limit concurrency to avoid starting an entire busy schedule at once.
  for (let i = 0; i < games.length; i += 4) {
    await Promise.all(games.slice(i, i + 4).map(async game => {
      try {
        const feed = await readJSON(playByPlay(game.gamePk), request);
        if (!Array.isArray(feed.allPlays)) throw new Error('Unexpected MLB play-by-play format');
        feeds.push({game, plays: feed.allPlays});
      } catch {
        failed.push(game.gamePk);
      }
    }));
  }
  feeds.sort((a, b) => a.game.gamePk - b.game.gamePk);
  return {feeds, failed, scheduled: games.length};
}

function playRow(game, play) {
  const away = game.teams?.away?.team?.name;
  const home = game.teams?.home?.team?.name;
  return {
    gamePk: game.gamePk, atBatIndex: play.atBatIndex,
    date: game.officialDate, season: game.season,
    teams: away && home ? `${away} @ ${home}` : null,
    player: play.matchup?.batter?.fullName
  };
}

export function getPending({game, plays}) {
  return plays.flatMap(play => {
    const marks = [play.result, ...(play.playEvents ?? []).map(event => event.details),
      ...(play.runners ?? []).map(runner => runner.details)].filter(mark => pendingCodes.has(mark?.eventType));
    return [...new Set(marks.map(mark => mark.eventType))].map(type => ({
      ...playRow(game, play), type, description: marks.find(mark => mark.eventType === type)?.description
    }));
  });
}

export function getReviews({game, plays}) {
  const overturned = details => details?.isOverturned === true && details?.inProgress === false;
  return plays.flatMap(play => {
    const base = playRow(game, play);
    const eventRows = (play.playEvents ?? []).filter(event => overturned(event.reviewDetails)).map(event => ({
      ...base, type: event.reviewDetails.reviewType, eventIndex: event.index,
      description: event.details?.description
    }));
    if (!overturned(play.reviewDetails)) return eventRows;
    // Avoid re-listing a pitch review also represented as the terminal plate-appearance result.
    const type = play.reviewDetails.reviewType;
    const terminal = (play.playEvents ?? []).at(-1);
    if (type && terminal?.index != null && eventRows.some(row => row.type === type && row.eventIndex === terminal.index)) {
      return eventRows.map(row => row.eventIndex === terminal.index
        ? {...row, description: play.result?.description ?? row.description} : row);
    }
    return [...eventRows, {...base, type, description: play.result?.description}];
  });
}
