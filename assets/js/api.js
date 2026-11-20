/* LiveScoringErrors-Pending — data layer */
/* Loads the harvested payload and the per-season review archives that
   scripts/build_payload.py writes from the official MLB feeds. Everything the
   page shows is either read from those files or fetched live from
   statsapi.mlb.com in the visitor's browser. Nothing is estimated or typed by hand. */

const API = (() => {
  const PAYLOAD = "data/site/payload.json";
  let payload = null;
  const files = new Map();
  const loadListeners = [];

  function onLoad(fn) { loadListeners.push(fn); if (payload) fn(payload); }

  async function loadJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    return res.json();
  }

  async function load() {
    try {
      payload = await loadJSON(PAYLOAD);
    } catch (err) {
      console.warn("[api] payload load failed, using empty shell:", err);
      payload = emptyPayload();
      for (const fn of loadListeners) fn(payload);
      throw err;
    }
    for (const fn of loadListeners) fn(payload);
    return payload;
  }

  /** Load one season's overturned-review archive (cached after the first read). */
  async function loadReviews(series) {
    if (!series || !series.url) return { reviews: [], pitchChallenges: [] };
    if (!files.has(series.url)) {
      files.set(series.url, loadJSON(series.url).catch(err => {
        files.delete(series.url);
        throw err;
      }));
    }
    return files.get(series.url);
  }

  function get() { return payload || emptyPayload(); }

  const mlb = import("./mlb.js");

  async function fetchLivePending() {
    const core = await mlb;
    const date = core.easternDate();
    const result = await core.scanDate(date, true);
    return {
      live: result.feeds.flatMap(core.getPending).map(row => ({
        ...row, batter: row.player, eventType: row.type, pbp: core.playByPlay(row.gamePk)
      })),
      schedule: core.scheduleFor(date),
      failed: result.failed.map(core.playByPlay),
      note: `${date} (ET): ${result.feeds.length} of ${result.scheduled} live game feeds checked.`
    };
  }

  function emptyPayload() {
    return {
      generatedAt: null,
      seasons: [],
      run_removed: [],
      additions: [],
      candidates: [],
      reviews: [],
      reviewSeries: [],
      decisions: [],
      scorer: [],
      pending: { distribution: [], cases: [], note: "Payload not loaded." },
      model: {},
      correlations: [],
      anchors: [],
      meta: { coverage: {}, irregularities: [], freshness: "pending payload" }
    };
  }

  return { load, loadJSON, loadReviews, get, onLoad, fetchLivePending, mlb };
})();
