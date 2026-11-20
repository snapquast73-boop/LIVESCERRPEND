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
      for (const fn of loadListeners) fn(payload);
      return payload;
    } catch (err) {
      console.warn("[api] payload load failed, using empty shell:", err);
      payload = emptyPayload();
      for (const fn of loadListeners) fn(payload);
      return payload;
    }
  }

  function get() { return payload || emptyPayload(); }

  /* Live pending-ruling read from the official MLB Stats API.
     Reverts to an offline notice (never invents data) when unreachable. */
  async function fetchLivePending(signal) {
    const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=today";
    try {
      const res = await fetch(url, { signal, cache: "no-store" });
      if (!res.ok) throw new Error(`schedule ${res.status}`);
      const data = await res.json();
      const dates = data.dates || [];
      if (!dates.length) return { live: [], note: "No games scheduled today." };
      const gamePks = [];
      for (const d of dates) for (const g of d.games || []) gamePks.push(g.gamePk);
      const live = [];
      for (const pk of gamePks) {
        try {
          const p = await fetch(`https://statsapi.mlb.com/api/v1/game/${pk}/playByPlay`, { signal, cache: "no-store" });
          if (!p.ok) continue;
          const j = await p.json();
          const allPlays = [];
          const collect = (arr) => { for (const x of arr || []) { allPlays.push(x); if (x.playEvents) collect(x.playEvents); } };
          collect(j.allPlays || j.data?.allPlays || []);
          const pendingCodes = new Set(["os_ruling_pending_primary", "os_ruling_pending_prior"]);
          for (const play of allPlays) {
            const evs = play.playEvents || [play];
            for (const ev of evs) {
              if (pendingCodes.has(ev.eventType || ev.type?.code)) {
                live.push({
                  gamePk: pk, playId: ev.playId || play.playId,
                  description: ev.description || play.description || "—",
                    eventType: ev.eventType || ev.type?.code || "—",
                  batter: (ev.matchup && ev.matchup.batter && ev.matchup.batter.fullName) || "—",
                  pitcher: (ev.matchup && ev.matchup.pitcher && ev.matchup.pitcher.fullName) || "—",
                  inning: ev.inning || play.inning,
                  pbp: `https://statsapi.mlb.com/api/v1/game/${pk}/playByPlay`,
                  clip: `https://baseballsavant.mlb.com/sporty-videos?playId=${ev.playId || play.playId}`
                });
              }
            }
          }
        } catch (e) { continue; }
      }
      return { live, note: live.length ? `${live.length} pending state(s) found in today's games.` : "No pending rulings in today's games." };
    } catch (err) {
      return { live: [], note: "Live feed unreachable (statsapi.mlb.com). Showing harvested history instead." };
    }
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

  return { load, get, onLoad, fetchLivePending };
})();
