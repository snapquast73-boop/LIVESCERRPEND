/* LiveScoringErrors-Pending — all replay overturns view */

const Reviews = (() => {
  let rows = [];
  let sample = [];
  let scanned = [];

  function init(payload) {
    sample = (payload.reviews || []).slice();
    refreshRows();
    wire();
  }

  function refreshRows() {
    const key = row => `${row.gamePk}/${row.atBatIndex}/${row.reviewType}`;
    const known = new Set(sample.map(key));
    rows = [...sample, ...scanned.filter(row => !known.has(key(row)))];
    fillSeason("rv-season", [...new Set(rows.map(row => row.season).filter(Boolean))].sort());
    fillType("rv-type", [...new Set(rows.map(row => row.reviewType).filter(Boolean))].sort());
    render();
  }

  function fillSeason(id, list) {
    const el = R.$(id);
    if (!el) return;
    const had = el.value;
    el.innerHTML = '<option value="">all</option>';
    for (const s of list) el.add(new Option(s, s));
    el.value = list.includes(had) ? had : "";
  }
  function fillType(id, list) {
    const el = R.$(id);
    if (!el) return;
    const had = el.value;
    el.innerHTML = '<option value="">all</option>';
    for (const t of list) el.add(new Option(t, t));
    el.value = list.includes(had) ? had : "";
  }

  function wire() {
    const run = () => render();
    for (const id of ["rv-season", "rv-type", "rv-search"]) {
      const el = R.$(id);
      if (el) el.addEventListener(id === "rv-search" ? "input" : "change", run);
    }
    const form = R.$("rv-scan");
    const input = R.$("rv-date");
    const status = R.$("rv-scan-status");
    API.mlb.then(mlb => { input.max = input.value = mlb.easternDate(); });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const button = form.querySelector("button");
      const date = input.value;
      button.disabled = true;
      status.textContent = "Checking official MLB play-by-play…";
      try {
        const mlb = await API.mlb;
        const result = await mlb.scanDate(date, false);
        scanned = result.feeds.flatMap(mlb.getReviews).map(row => ({
          ...row, batter: row.player, play: row.description, reviewType: row.type,
          pbp: mlb.playByPlay(row.gamePk)
        }));
        status.innerHTML = `${esc(date)} (ET): ${result.feeds.length} of ${result.scheduled} eligible game feeds checked. ${R.link(mlb.scheduleFor(date), "Official MLB schedule")}`;
        if (result.failed.length) status.innerHTML += ` · Unavailable: ${result.failed.map(id => R.link(mlb.playByPlay(id), "game feed")).join(", ")}`;
      } catch {
        scanned = [];
        status.textContent = "MLB lookup unavailable. Showing the verified sample.";
      } finally {
        button.disabled = false;
        refreshRows();
      }
    });
  }

  function render() {
    const season = R.$("rv-season").value;
    const type = R.$("rv-type").value;
    const search = (R.$("rv-search").value || "").trim().toLowerCase();
    const filtered = rows.filter(r => {
      if (season && r.season !== season) return false;
      if (type && r.reviewType !== type) return false;
      if (search) {
        const hay = [r.play, r.batter, r.pitcher, r.teams, r.date, r.reviewType, r.reason].join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    });
    const html = filtered.map(r => R.card(`
      <div class="title">${esc(r.play || "Overturned review")}</div>
      <div class="meta">${esc(r.date || "—")} · ${esc(r.teams || "—")} · ${esc(r.season || "—")}</div>
      <div class="meta">${esc(r.reviewType || "—")} ${esc(r.reason ? "— " + r.reason : "")}</div>
      <div style="margin-top:0.35rem">${R.link(r.pbp, "official play-by-play")} ${r.clip ? R.link(r.clip, "watch clip") : ""} ${r.filmRoom ? R.link(r.filmRoom, "MLB game videos") : ""}</div>
    `)).join("");
    R.list("rv-list", html ? [`<div class="cards">${html}</div>`] : null);
    R.summary("rv-summary", `${filtered.length} overturn${filtered.length !== 1 ? "s" : ""} shown (${rows.length} total on file).`);
    R.notice("rv-notice", filtered.length === 0 && rows.length ? "No reviews match the current filters." : "");
  }

  function esc(s) { return R.esc(s); }
  return { init };
})();
