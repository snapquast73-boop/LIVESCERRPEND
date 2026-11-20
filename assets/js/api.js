/* LiveScoringErrors-Pending — data layer */
/* Loads the bundled snapshot payload; attempts a live MLB Stats API read for the
   pending-ruling panel, and degrades gracefully when the network cannot reach
   statsapi.mlb.com. Nothing is estimated or typed by hand; every row carries its
   official source link. */

const API = (() => {
  const PAYLOAD = "data/site/payload.json";
  let payload = null;
  let loadListeners = [];

  function onLoad(fn) { loadListeners.push(fn); if (payload) fn(payload); }

  async function load() {
    try {
      const res = await fetch(PAYLOAD, { cache: "no-store" });
      if (!res.ok) throw new Error(`payload ${res.status}`);
      payload = await res.json();
    } catch (err) {
      console.warn("[api] payload load failed, using empty shell:", err);
      payload = emptyPayload();
      for (const fn of loadListeners) fn(payload);
      throw err;
    }
    for (const fn of loadListeners) fn(payload);
    return payload;
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
      run_removed: [],
      additions: [],
      candidates: [],
      reviews: [],
      decisions: [],
      scorer: [],
      pending: { distribution: [], cases: [], note: "Payload not loaded." },
      model: {},
      correlations: [],
      anchors: [],
      meta: { coverage: {}, irregularities: [], freshness: "pending payload" }
    };
  }

  return { load, get, onLoad, fetchLivePending, mlb };
})();
