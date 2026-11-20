/* LiveScoringErrors-Pending — all replay overturns view */

const Reviews = (() => {
  let rows = [];
  let seasons = [];
  let types = [];

  function init(payload) {
    rows = (payload.reviews || []).slice();
    seasons = [...new Set((payload.reviews || []).map(r => r.season).filter(Boolean))].sort();
    types = [...new Set((payload.reviews || []).map(r => r.reviewType).filter(Boolean))].sort();
    fillSeason("rv-season", seasons);
    fillType("rv-type", types);
    render();
    wire();
  }

  function fillSeason(id, list) {
    const el = R.$(id);
    if (!el) return;
    const had = el.value;
    el.innerHTML = '<option value="">all</option>';
    for (const s of list) el.add(new Option(s, s));
    el.value = had;
  }
  function fillType(id, list) {
    const el = R.$(id);
    if (!el) return;
    const had = el.value;
    el.innerHTML = '<option value="">all</option>';
    for (const t of list) el.add(new Option(t, t));
    el.value = had;
  }

  function wire() {
    const run = () => render();
    for (const id of ["rv-season", "rv-type", "rv-search"]) {
      const el = R.$(id);
      if (el) el.addEventListener(id === "rv-search" ? "input" : "change", run);
    }
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
      <div style="margin-top:0.35rem">${R.link(r.pbp, "official play-by-play")} ${r.clip ? R.link(r.clip, "watch clip") : ""} ${r.gameday ? R.link(r.gameday, "Gameday") : ""}</div>
    `)).join("");
    R.list("rv-list", html ? [`<div class="cards">${html}</div>`] : null);
    R.summary("rv-summary", `${filtered.length} overturn${filtered.length !== 1 ? "s" : ""} shown (${rows.length} total on file).`);
    R.notice("rv-notice", filtered.length === 0 && rows.length ? "No reviews match the current filters." : "");
  }

  function esc(s) { return R.esc(s); }
  return { init };
})();
