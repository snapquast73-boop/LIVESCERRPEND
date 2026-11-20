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

/* ------------------------------------------------------------------ *
 * Live replay feed helpers (used by the "All replay overturns" tab and
 * by reviews.html). Same official feed, different presentation.
 * ------------------------------------------------------------------ */

export const reviewReasonsUrl = () => `${api}/reviewReasons`;

/** MLB's own review-reason registry (code -> description). */
export async function reviewReasonRegistry(request = fetch) {
  const rows = await readJSON(reviewReasonsUrl(), request);
  if (!Array.isArray(rows)) throw new Error('Unexpected MLB review-reason registry format');
  return Object.fromEntries(rows.filter(row => row.code).map(row => [row.code, row.description]));
}

/** Longest suffix of a feed review code that exists in MLB's registry. */
export function reasonCode(reviewType, registry) {
  if (!reviewType || !registry) return null;
  if (registry[reviewType]) return reviewType;
  const suffix = reviewType.slice(-1);
  return registry[suffix] ? suffix : null;
}

/** A pitch challenge is attached to a pitch event, or reports a pitch-result reason. */
export function isPitchReview(reviewType, registry, eventIndex) {
  if (eventIndex !== null && eventIndex !== undefined) return true;
  const code = reasonCode(reviewType, registry);
  return code === 'J' || code === 'I' || code === 'Z';
}

const runsCredited = play => (play.runners ?? [])
  .filter(runner => runner.details?.isScoringEvent === true).length;

/** Every review record in one game, overturned or not, at play and pitch level. */
export function reviewEvents({game, plays}, registry = {}) {
  const rows = [];
  const base = play => ({
    gamePk: game.gamePk,
    atBatIndex: play.atBatIndex,
    date: game.officialDate,
    season: game.season,
    teams: game.teams ? `${game.teams.away?.team?.name} @ ${game.teams.home?.team?.name}` : null,
    batter: play.matchup?.batter?.fullName ?? null,
    pitcher: play.matchup?.pitcher?.fullName ?? null,
    inning: play.about?.inning ?? null,
    half: play.about?.halfInning ?? null,
    event: play.result?.eventType ?? null,
    description: play.result?.description ?? null,
    runsCredited: runsCredited(play)
  });
  for (const play of plays) {
    if (play.reviewDetails) {
      rows.push({
        ...base(play), eventIndex: null,
        reviewType: play.reviewDetails.reviewType ?? null,
        inProgress: play.reviewDetails.inProgress === true,
        overturned: play.reviewDetails.isOverturned === true
      });
    }
    for (const event of play.playEvents ?? []) {
      if (!event.reviewDetails) continue;
      rows.push({
        ...base(play), eventIndex: event.index ?? null,
        reviewType: event.reviewDetails.reviewType ?? null,
        inProgress: event.reviewDetails.inProgress === true,
        overturned: event.reviewDetails.isOverturned === true,
        description: event.details?.description ?? play.result?.description ?? null,
        playId: event.playId ?? null
      });
    }
  }
  for (const row of rows) {
    row.isPitch = isPitchReview(row.reviewType, registry, row.eventIndex);
    const code = reasonCode(row.reviewType, registry);
    row.reasonCode = code;
    row.reason = code ? registry[code] : null;
  }
  return rows;
}

/** Scan one date's finished and in-progress games and summarise their reviews. */
export async function scanReviews(date, request = fetch) {
  let registry = {};
  try {
    registry = await reviewReasonRegistry(request);
  } catch {
    registry = {};
  }
  const result = await scanDate(date, false, request);
  const rows = result.feeds.flatMap(feed => reviewEvents(feed, registry));
  return {...result, rows, registry};
}
