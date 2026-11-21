/* LiveScoringErrors-Pending — all replay overturns view.
   The archived rows come from data/site/reviews-<season>.json, written by
   scripts/build_payload.py from the official play-by-play. The date lookup below
   reads a date straight from statsapi.mlb.com in the visitor's browser and starts
   on its own the first time the tab is opened. */

const Reviews = (() => {
  let manifest = [];
  const loaded = new Map();
  let scanned = [];
  let current = null;
  let busy = false;
  let panel = null;

  function init(payload) {
    manifest = (payload.reviewSeries || []).slice();
    if (!manifest.length && (payload.reviews || []).length) {
      manifest = [{ season: "sample", url: null, count: payload.reviews.length, rows: payload.reviews }];
    }
    fillSeasons();
    wire();
    return select(manifest.length ? manifest[0].season : "");
  }

  function fillSeasons() {
    const el = R.$("rv-season");
    if (!el) return;
    el.innerHTML = '<option value="">all seasons</option>';
    for (const item of manifest) el.add(new Option(`${item.season} (${item.count})`, item.season));
  }

  async function select(season) {
    current = season;
    if (busy) return;
    busy = true;
    R.notice("rv-notice", "Loading the archived reviews…");
    try {
      if (season === "") {
        for (const item of manifest) await ensure(item);
      } else {
        const item = manifest.find(entry => entry.season === season);
        if (item) await ensure(item);
      }
      R.notice("rv-notice", "");
    } catch (err) {
      R.notice("rv-notice", `Could not load ${season || "the archive"}: ${err.message}`);
    } finally {
      busy = false;
      refresh();
    }
  }

  async function ensure(item) {
    if (!item || loaded.has(item.season)) return;
    if (!item.url) { loaded.set(item.season, { reviews: item.rows || [], pitchChallenges: [] }); return; }
    const doc = await API.loadReviews(item);
    loaded.set(item.season, { reviews: doc.reviews || [], pitchChallenges: [] });
  }

  function wire() {
    const seasonEl = R.$("rv-season");
    if (seasonEl) seasonEl.addEventListener("change", () => select(seasonEl.value));
    for (const id of ["rv-type", "rv-search"]) {
      const el = R.$(id);
      if (el) el.addEventListener(id === "rv-search" ? "input" : "change", refresh);
    }
    // The date panel (assets/js/date-panel.js) owns the lookup form, its status
    // line, the first-visit auto-scan and the "follow today" refresh.
    if (typeof datePanel === "function" && R.$("rv-scan")) {
      panel = datePanel("rv", (feeds, mlb) => {
        scanned = !mlb ? [] : feeds.flatMap(feed => mlb.getReviews(feed).map(row => ({
          ...row,
          batter: row.player,
          play: row.description,
          reviewType: row.type,
          pbp: mlb.playByPlay(row.gamePk),
          filmRoom: `https://www.mlb.com/video/game/${row.gamePk}`,
          scannedLive: true
        })));
        refresh();
      }, "Showing the archived rows only.");
    }
  }

  function allRows() {
    const rows = [];
    for (const [, doc] of loaded) rows.push(...(doc.reviews || []));
    rows.push(...scanned);
    const seen = new Set();
    return rows.filter(row => {
      const key = `${row.gamePk}/${row.atBatIndex}/${row.terminalReview ? "play" : row.eventIndex ?? "play"}/${row.reviewType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function refresh() {
    const rows = allRows();
    fillTypes(rows);
    render(rows);
  }

  function fillTypes(rows) {
    const el = R.$("rv-type");
    if (!el) return;
    const had = el.value;
    const types = [...new Set(rows.map(row => row.reviewType).filter(Boolean))].sort();
    el.innerHTML = '<option value="">all codes</option>';
    for (const type of types) el.add(new Option(type, type));
    el.value = types.includes(had) ? had : "";
  }

  function render(rows) {
    const seasonEl = R.$("rv-season");
    const typeEl = R.$("rv-type");
    const season = seasonEl ? seasonEl.value : "";
    const type = typeEl ? typeEl.value : "";
    const search = ((R.$("rv-search") || {}).value || "").trim().toLowerCase();
    const filtered = rows.filter(row => {
      if (season && String(row.season) !== season) return false;
      if (type && row.reviewType !== type) return false;
      if (search) {
        const hay = [row.play, row.batter, row.pitcher, row.teams, row.date, row.reviewType, row.reason]
          .join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    const html = filtered.map(row => R.card(`
      <div class="title">${esc(row.play || "Overturned review")}</div>
      <div class="meta">${esc(row.date || "—")} · ${esc(row.teams || "—")} · ${esc(row.season || "—")}</div>
      <div class="meta">
        ${R.chip(row.reviewType || "code —", "ok")}
        ${row.reason ? esc(`${row.reasonCode} — ${row.reason}`) : "reason not in MLB's registry"}
        ${row.inning ? ` · ${esc(row.half || "")} ${esc(row.inning)}` : ""}
        ${row.scannedLive ? R.chip("from this lookup", "warn") : ""}
      </div>
      <div style="margin-top:0.35rem">
        ${R.link(row.pbp, "official play-by-play")}
        ${row.savant ? R.link(row.savant, "Savant clip") : ""}
        ${row.filmRoom ? R.link(row.filmRoom, "MLB game videos") : ""}
      </div>
    `)).join("");

    const el = R.$("rv-list");
    if (el) {
      el.innerHTML = filtered.length
        ? `<div class="cards">${html}</div>`
        : `<p class="empty">${rows.length ? "No reviews match the current filters." : "No archived reviews loaded yet."}</p>`;
    }

    const pitch = [...loaded.values()].reduce((total, doc) => total + (doc.pitchChallenges || []).length, 0);
    R.summary("rv-summary", `${filtered.length} overturn${filtered.length !== 1 ? "s" : ""} shown` +
      ` · ${rows.length} on file${season === "" ? " across the loaded seasons" : ""}` +
      (pitch ? ` · ${pitch} automated pitch challenges counted separately` : ""));
    R.notice("rv-notice", filtered.length === 0 && rows.length ? "No reviews match the current filters." : "");
  }

  function esc(s) { return R.esc(s); }

  return {
    init,
    open: () => panel && panel.open(),
    refreshToday: () => panel && panel.refreshToday()
  };
})();
