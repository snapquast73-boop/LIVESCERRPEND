/* LiveScoringErrors-Pending — all replay overturns view.
   The archived rows come from data/site/reviews-<season>.json, written by
   scripts/build_payload.py from the official play-by-play. The scan below reads
   a date straight from statsapi.mlb.com in the visitor's browser. */

const Reviews = (() => {
  let manifest = [];
  const loaded = new Map();
  let scanned = [];
  let current = null;
  let busy = false;

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
    for (const item of manifest) {
      el.add(new Option(`${item.season} (${item.count})`, item.season));
    }
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
    loaded.set(item.season, { reviews: doc.reviews || [], pitchChallenges: doc.pitchChallenges || [] });
  }

  function wire() {
    const seasonEl = R.$("rv-season");
    if (seasonEl) seasonEl.addEventListener("change", () => select(seasonEl.value));
    for (const id of ["rv-type", "rv-search"]) {
      const el = R.$(id);
      if (el) el.addEventListener(id === "rv-search" ? "input" : "change", refresh);
    }
    const form = R.$("rv-scan");
    const input = R.$("rv-date");
    const status = R.$("rv-scan-status");
    if (!form) return;
    API.mlb.then(mlb => { input.max = mlb.easternDate(); });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const button = form.querySelector("button");
      const date = input.value;
      button.disabled = true;
      status.textContent = "Checking official MLB play-by-play…";
      try {
        const mlb = await API.mlb;
        const result = await mlb.scanReviews(date);
        scanned = result.rows
          .filter(row => row.overturned && !row.inProgress)
          .map(row => ({
            gamePk: row.gamePk, atBatIndex: row.atBatIndex, eventIndex: row.eventIndex,
            season: String(row.season || date.slice(0, 4)), date: row.date,
            teams: row.teams, batter: row.batter, pitcher: row.pitcher,
            reviewType: row.reviewType, reasonCode: row.reasonCode, reason: row.reason,
            inning: row.inning, half: row.half,
            play: row.description, event: row.event, playId: row.playId,
            pbp: mlb.playByPlay(row.gamePk),
            filmRoom: `https://www.mlb.com/video/game/${row.gamePk}`,
            savant: row.playId ? `https://baseballsavant.mlb.com/sporty-videos?playId=${row.playId}` : null,
            source: mlb.playByPlay(row.gamePk),
            scannedLive: true
          }));
        status.innerHTML = `${esc(date)} (ET): ${result.feeds.length} of ${result.scheduled} eligible game feeds checked.` +
          ` ${R.link(mlb.scheduleFor(date), "Official MLB schedule")}` +
          (result.failed.length ? ` · Unavailable: ${result.failed.map(id => R.link(mlb.playByPlay(id), "game feed")).join(", ")}` : "");
      } catch {
        scanned = [];
        status.textContent = "MLB lookup unavailable from this browser. Showing the archived rows.";
      } finally {
        button.disabled = false;
        refresh();
      }
    });
  }

  function allRows() {
    const rows = [];
    for (const [, doc] of loaded) rows.push(...(doc.reviews || []));
    rows.push(...scanned);
    const seen = new Set();
    return rows.filter(row => {
      const key = `${row.gamePk}/${row.atBatIndex}/${row.eventIndex ?? "play"}`;
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
    const type = R.$("rv-type").value;
    const search = (R.$("rv-search").value || "").trim().toLowerCase();
    const filtered = rows.filter(row => {
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
        ${row.scannedLive ? R.chip("from this scan", "warn") : ""}
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
      ` · ${rows.length} on file for ${current === "" ? "all loaded seasons" : (current || "this view")}` +
      (pitch ? ` · ${pitch} automated pitch challenges counted separately` : ""));
    R.notice("rv-notice", filtered.length === 0 && rows.length ? "No reviews match the current filters." : "");
  }

  function esc(s) { return R.esc(s); }
  return { init };
})();
