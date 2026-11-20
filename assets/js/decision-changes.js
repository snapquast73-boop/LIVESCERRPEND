/* LiveScoringErrors-Pending — scorer decision changes view */

const DecisionChanges = (() => {
  let rows = [];

  function init(payload) {
    rows = (payload.decisions || []).slice();
    render();
    wire();
  }

  function wire() {
    const run = () => render();
    const sel = R.$("dc-transition");
    const box = R.$("dc-rbi");
    if (sel) sel.addEventListener("change", run);
    if (box) box.addEventListener("change", run);
    const search = R.$("dc-search");
    if (search) search.addEventListener("input", run);
  }

  function render() {
    const trans = R.$("dc-transition").value;
    const onlyRBI = R.$("dc-rbi").checked;
    const search = (R.$("dc-search").value || "").trim().toLowerCase();
    const classified = rows.filter(r => r.before && r.after);
    const filtered = classified.filter(r => {
      if (trans && transitionKey(r) !== trans) return false;
      if (onlyRBI && !r.rbiChanged) return false;
      if (search) {
        const hay = [r.before, r.after, r.player, r.date, r.span].join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    });
    const html = filtered.map(r => R.card(`
      <div class="title">${esc(r.player || "Entry")} · ${esc(r.date || "—")}</div>
      <div class="meta">${esc(r.season || "—")} · entry ${esc(r.entryNo || "—")}</div>
      <div class="meta">before: <b>${esc(r.before)}</b> → after: <b>${esc(r.after)}</b></div>
      <div class="meta">RBI effect: ${esc(r.rbiEffect || "—")} ${r.rbiChanged ? R.chip("RBI changed", "bad") : ""}</div>
      <div style="margin-top:0.35rem;font-size:0.78rem;color:var(--muted)">${esc(r.span || "—")}</div>
      <div style="margin-top:0.25rem">${r.source ? R.link(r.source, "official bulletin") : ""}</div>
    `)).join("");
    R.list("dc-list", html ? [`<div class="cards">${html}</div>`] : null);
    const unclassified = rows.filter(r => !(r.before && r.after)).length;
    R.summary("dc-summary", `${filtered.length} classified reversal${filtered.length !== 1 ? "s" : ""} shown · ${classified.length} classified · ${unclassified} unclassified entries not guessed.`);
    R.notice("dc-notice", filtered.length === 0 && classified.length ? "No entries match the current filters." : "");
  }

  function transitionKey(r) {
    const b = (r.before || "").toLowerCase();
    const a = (r.after || "").toLowerCase();
    const map = { error: "error", hit: "hit", fielder: "fielders_choice", "fielder's choice": "fielders_choice", "fielders choice": "fielders_choice", out: "out" };
    const kb = map[b] || b;
    const ka = map[a] || a;
    return `${kb}->${ka}`;
  }

  function esc(s) { return R.esc(s); }
  return { init };
})();
