/* LiveScoringErrors-Pending — scorer decision changes view.
   Rows come from data/decision_changes.json, which scripts/harvest_scoring_changes.py
   parses from MLB's official post-game scoring-change bulletin. The official
   sentence is quoted on every row; a before/after call is shown only when that
   sentence states both sides of the change. */

const DecisionChanges = (() => {
  let rows = [];
  const LABEL = { error: "error", hit: "hit", fielders_choice: "fielder's choice" };

  function init(payload) {
    rows = (payload.decisions || []).slice();
    render();
    wire();
  }

  function wire() {
    const run = () => render();
    for (const id of ["dc-transition", "dc-rbi", "dc-rows"]) {
      const el = R.$(id);
      if (el) el.addEventListener("change", run);
    }
    const search = R.$("dc-search");
    if (search) search.addEventListener("input", run);
  }

  function render() {
    const trans = R.$("dc-transition").value;
    const onlyRBI = R.$("dc-rbi").checked;
    const mode = R.$("dc-rows") ? R.$("dc-rows").value : "classified";
    const search = (R.$("dc-search").value || "").trim().toLowerCase();

    const classified = rows.filter(row => row.classified || (row.before && row.after && row.before !== row.after));
    const pool = mode === "all" ? rows : classified;
    const filtered = pool.filter(row => {
      if (mode !== "all" && trans && transitionKey(row) !== trans) return false;
      if (onlyRBI && !row.rbiChanged) return false;
      if (search) {
        const hay = [row.before, row.after, row.game, row.date, row.span, row.rbiEffect]
          .join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    });

    const html = filtered.map(row => {
      const before = row.before ? LABEL[row.before] || row.before : "not stated";
      const after = row.after ? LABEL[row.after] || row.after : "not stated";
      const verdict = row.before && row.after
        ? `<span class="meta">before: <b>${esc(before)}</b> → after: <b>${esc(after)}</b></span>`
        : `<span class="meta">call change not stated in one sentence — text quoted, nothing assumed</span>`;
      return R.card(`
        <div class="title">${esc(row.season || "—")} · entry ${esc(row.entryNo || "—")} · ${esc(row.date || "—")} ${esc(row.game || "")}</div>
        <div class="meta">${verdict}</div>
        <div class="meta">RBI effect: ${row.rbiChanged ? esc(row.rbiEffect) + " " + R.chip("RBI changed", "bad") : "(not stated in the official text)"}</div>
        <div style="margin-top:0.35rem;font-size:0.8rem;color:var(--muted)">${esc(row.span || "")}</div>
        ${row.rbiQuote ? `<div class="meta" style="font-size:0.8rem">RBI source sentence: “${esc(row.rbiQuote)}”</div>` : ""}
        <div style="margin-top:0.25rem">${row.source ? R.link(row.source, "official bulletin") : ""}</div>
      `);
    }).join("");

    const el = R.$("dc-list");
    if (el) el.innerHTML = html ? `<div class="cards">${html}</div>` : '<p class="empty">No entries match the current filters.</p>';

    const unclassified = rows.length - classified.length;
    R.summary("dc-summary", `${filtered.length} row${filtered.length !== 1 ? "s" : ""} shown · ` +
      `${classified.length} classified reversal${classified.length !== 1 ? "s" : ""} · ` +
      `${unclassified} bulletin entr${unclassified !== 1 ? "ies" : "y"} without a stated call change (never guessed)`);
    R.notice("dc-notice", filtered.length === 0 && rows.length ? "No entries match the current filters." : "");
  }

  function transitionKey(row) {
    return `${row.before || ""}->${row.after || ""}`;
  }

  function esc(s) { return R.esc(s); }
  return { init };
})();
