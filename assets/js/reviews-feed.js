/* LiveScoringErrors-Pending — live replay feed (reviews.html).
   Reads the official Stats API in the visitor's browser: the date's schedule,
   then each eligible game's play-by-play, and reports every review record in it.
   Nothing is stored or inferred; each row keeps its official source links. */

const ReplayFeed = (() => {
  const POLL_MS = 20000;
  let date = "";
  let rows = [];
  let games = [];
  let failed = [];
  let scheduled = 0;
  let busy = false;
  let timer = null;
  let updatedAt = null;
  let lastError = "";

  const MAX = () => (document.getElementById("feed-max")?.value || "");

  function start() {
    const input = document.querySelector("#rf-date");
    API.mlb.then(mlb => {
      const today = new URLSearchParams(location.search).get("date") || mlb.easternDate();
      date = input.max = today;
      input.value = today;
      bind();
      load();
    }).catch(() => {
      lastError = "Could not load the feed module.";
      render();
    });
  }

  function bind() {
    const input = document.querySelector("#rf-date");
    input.addEventListener("change", () => { date = input.value; load(); });
    document.querySelector("#rf-prev").addEventListener("click", () => shift(-1));
    document.querySelector("#rf-next").addEventListener("click", () => shift(1));
    document.querySelector("#rf-today").addEventListener("click", () => API.mlb.then(mlb => { date = mlb.easternDate(); input.value = date; load(); }));
    document.querySelector("#rf-refresh").addEventListener("click", load);
    for (const id of ["rf-type", "rf-search", "rf-show"]) {
      document.querySelector(`#${id}`).addEventListener(id === "rf-search" ? "input" : "change", render);
    }
    setInterval(() => { if (!document.hidden) tick(); }, 1000);
  }

  function shift(days) {
    if (!date) return;
    const next = new Date(`${date}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + days);
    const iso = next.toISOString().slice(0, 10);
    API.mlb.then(mlb => { if (iso > mlb.easternDate()) return; date = iso; document.querySelector("#rf-date").value = iso; load(); });
  }

  async function load() {
    if (busy || !date) return;
    busy = true;
    const status = document.querySelector("#rf-status");
    status.textContent = "Reading the official MLB feeds…";
    try {
      const mlb = await API.mlb;
      const result = await mlb.scanReviews(date);
      rows = result.rows;
      games = result.feeds.map(feed => feed.game);
      failed = result.failed;
      scheduled = result.scheduled;
      updatedAt = new Date();
      lastError = "";
      status.innerHTML = `${esc(date)} ET · ${result.feeds.length} of ${scheduled} eligible game feeds checked · ` +
        `${R.link(mlb.scheduleFor(date), "official schedule")}` +
        (failed.length ? ` · unavailable: ${failed.map(id => R.link(mlb.playByPlay(id), "game feed")).join(", ")}` : "");
    } catch (err) {
      rows = []; games = []; failed = []; scheduled = 0;
      lastError = String(err && err.message ? err.message : err);
      status.innerHTML = "The MLB feed is unavailable from this browser. " +
        `${R.link("https://statsapi.mlb.com/api/v1/schedule?sportId=1", "Official schedule")}`;
    } finally {
      busy = false;
      render();
      schedule();
    }
  }

  function liveGames() {
    return games.filter(game => game.status?.abstractGameState === "Live").length;
  }

  function schedule() {
    clearTimeout(timer);
    if (liveGames() > 0) timer = setTimeout(() => { if (!document.hidden) load(); }, POLL_MS);
  }

  function tick() {
    const countdown = document.querySelector("#rf-countdown");
    if (!countdown) return;
    countdown.textContent = liveGames() > 0
      ? `LIVE · next check in ${Math.max(0, POLL_MS / 1000 - Math.round((Date.now() - (updatedAt?.getTime() || Date.now())) / 1000))}s`
      : (updatedAt ? "no game in progress · press Refresh to re-check" : "");
  }

  function render() {
    const playReviews = rows.filter(row => !row.isPitch);
    const pitch = rows.filter(row => row.isPitch);
    const overturned = playReviews.filter(row => row.overturned && !row.inProgress);
    const confirmed = playReviews.filter(row => !row.overturned && !row.inProgress);
    const under = rows.filter(row => row.inProgress);
    const atRisk = playReviews.filter(row => (row.overturned || row.inProgress) && row.runsCredited > 0);

    const stats = [
      ["Reviews & challenges", playReviews.length, "review records on the field"],
      ["Overturned", overturned.length, "call changed after review"],
      ["Confirmed", confirmed.length, "call stood"],
      ["Under review", under.length, "still in progress"],
      ["ABS pitch challenges", pitch.length, "pitch-result reviews"],
      ["Runs on reviewed plays", atRisk.length, "reviewed play credited at least one run"],
    ];
    const statBox = document.querySelector("#rf-stats");
    if (statBox) {
      statBox.innerHTML = stats.map(([label, value, note]) => `
        <div class="stat">
          <div class="stat-value">${Number(value) || 0}</div>
          <div class="stat-label">${esc(label)}</div>
          <div class="stat-note">${esc(note)}</div>
        </div>`).join("");
    }

    fillTypes(playReviews);
    const type = document.querySelector("#rf-type").value;
    const show = document.querySelector("#rf-show").value;
    const search = (document.querySelector("#rf-search").value || "").trim().toLowerCase();
    const cap = Number(MAX()) || 0;

    let list = rows.slice();
    if (show === "overturned") list = list.filter(row => row.overturned && !row.inProgress);
    if (show === "live") list = list.filter(row => row.inProgress);
    if (show === "pitch") list = list.filter(row => row.isPitch);
    if (type) list = list.filter(row => row.reviewType === type);
    if (search) {
      list = list.filter(row => [row.description, row.batter, row.pitcher, row.teams, row.reason, row.reviewType]
        .join(" | ").toLowerCase().includes(search));
    }
    list.sort((a, b) => (b.gamePk - a.gamePk) || (b.atBatIndex - a.atBatIndex));
    if (cap) list = list.slice(0, cap);

    const listEl = document.querySelector("#rf-list");
    if (listEl) {
      listEl.innerHTML = list.length ? list.map(row => R.card(`
        <div class="title">${esc(row.description || "Review")}</div>
        <div class="meta">game ${esc(row.gamePk)} · ${esc(row.date || date)} · ${esc(row.teams || "—")}</div>
        <div class="meta">
          ${R.chip(row.reviewType || "code —", row.overturned ? "bad" : row.inProgress ? "warn" : "ok")}
          ${row.inProgress ? R.chip("in progress", "warn") : row.overturned ? "overturned" : "confirmed"}
          ${row.reason ? ` · ${esc(row.reasonCode)} — ${esc(row.reason)}` : ""}
          ${row.isPitch ? " · pitch challenge" : ""}
          ${row.runsCredited ? ` · ${row.runsCredited} run${row.runsCredited !== 1 ? "s" : ""} credited to this play` : ""}
          ${row.inning ? ` · ${esc(row.half || "")} ${esc(row.inning)}` : ""}
        </div>
        <div style="margin-top:0.35rem">
          ${R.link(`https://statsapi.mlb.com/api/v1/game/${row.gamePk}/playByPlay`, "official play-by-play")}
          ${row.playId ? R.link(`https://baseballsavant.mlb.com/sporty-videos?playId=${row.playId}`, "Savant clip") : ""}
          ${R.link(`https://www.mlb.com/video/game/${row.gamePk}`, "MLB game videos")}
        </div>
      `)).join("") : `<p class="empty">${lastError ? "Feed unavailable — " + esc(lastError) : "No review records for this date and filter."}</p>`;
    }

    const line = document.querySelector("#rf-summary");
    if (line) {
      line.textContent = `${list.length} row${list.length !== 1 ? "s" : ""} shown` +
        (updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : "") +
        ` · ${games.length} of ${scheduled} games read` + (failed.length ? ` · ${failed.length} feed(s) unavailable` : "");
    }
    tick();
  }

  function fillTypes(rowsIn) {
    const el = document.querySelector("#rf-type");
    const had = el.value;
    const types = [...new Set(rowsIn.map(row => row.reviewType).filter(Boolean))].sort();
    el.innerHTML = '<option value="">all review codes</option>';
    for (const type of types) el.add(new Option(type, type));
    el.value = types.includes(had) ? had : "";
  }

  function esc(value) { return R.esc(value); }

  return { start };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ReplayFeed.start);
} else {
  ReplayFeed.start();
}
