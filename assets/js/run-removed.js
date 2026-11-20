/* LiveScoringErrors-Pending — run-removed overturns view */

const RunRemoved = (() => {
  let rows = [];
  let seasons = [];

  function init(payload) {
    rows = [...(payload.run_removed || []), ...(payload.additions || []), ...(payload.candidates || [])];
    seasons = [...new Set(rows.map(r => r.season).filter(Boolean))].sort();
    fillSeason("rr-season", seasons);
    render();
    wire();
  }

  function fillSeason(id, seasons) {
    const el = R.$(id);
    if (!el) return;
    const had = el.value;
    el.innerHTML = '<option value="">all</option>';
    for (const s of seasons) el.add(new Option(s, s));
    el.value = had;
  }

  function wire() {
    const sel = R.$("rr-season");
    const search = R.$("rr-search");
    const rowsSel = R.$("rr-rows");
    const btn = R.$("rr-csv");
    const run = () => render();
    if (sel) sel.addEventListener("change", run);
    if (search) search.addEventListener("input", run);
    if (rowsSel) rowsSel.addEventListener("change", run);
    if (btn) btn.addEventListener("click", downloadCSV);
  }

  function matches(row, season, search, mode) {
    if (season && row.season !== season) return false;
    if (mode === "run_removals" && !row.runsRemoved && row.runsRemoved !== 0) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [row.batter, row.pitcher, row.teams, row.date, row.play, row.event].join(" | ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function render() {
    const season = R.$("rr-season").value;
    const search = (R.$("rr-search").value || "").trim().toLowerCase();
    const mode = R.$("rr-rows").value;
    const filtered = rows.filter(r => matches(r, season, search, mode));

    const parts = [];
    for (const r of filtered) {
      const inputs = [];
      if (r.runnersOn != null) inputs.push(`runners on base: ${r.runnersOn}`);
      if (r.runnersOn != null) inputs.push(`+ 1 batter`);
      if (r.runsCredited != null) inputs.push(`− ${r.runsCredited} credited`);
      const removed = r.runsRemoved != null ? r.runsRemoved : "—";
      const sourceLink = R.link(r.pbp || r.source, "official play-by-play");
      const clipLink = r.clip ? R.link(r.clip, "watch clip") : "no clip";
      const gameday = r.gameday ? R.link(r.gameday, "Gameday") : "";
      const film = r.filmRoom ? R.link(r.filmRoom, "Film Room") : "";
      let verdict = "";
      if (r.runsRemoved != null) verdict = R.chip(`${removed} run${removed !== 1 ? "s" : ""} removed`, "bad");
      else if (r.addition) verdict = R.chip("addition (no count)", "ok");
      else verdict = R.chip("candidate — no derivable count", "warn");
      parts.push(R.card(`
        <div class="title">${esc(r.play || "Play")}</div>
        <div class="meta">${esc(r.date || "—")} · ${esc(r.teams || "—")} · ${esc(r.season || "—")}</div>
        <div class="meta" style="font-size:0.78rem">${esc(r.event || "—")} · ${esc(r.inning || "—")}</div>
        ${r.runsRemoved == null ? '<p class="meta">Value left blank. See <a href="flagged-for-review.html">Flagged for Review</a>.</p>' :
          `<div class="meta">${inputs.join(" ")} = <b>${esc(removed)}</b> runs removed on this play.</div>`}
        <div class="meta" style="margin-top:0.25rem">${verdict} ${sourceLink} ${clipLink} ${gameday} ${film}</div>
      `));
    }

    R.list("rr-list", parts);
    R.$("rr-csv").disabled = filtered.length === 0;
    const totalRemoved = rows.filter(r => r.runsRemoved != null).reduce((a, b) => a + (Number(r.runsRemoved) || 0), 0);
    R.summary("rr-summary", `
      ${filtered.length} row${filtered.length !== 1 ? "s" : ""} shown
      ${rows.filter(r => r.runsRemoved != null).length > 0 ? ` · ${rows.filter(r => r.runsRemoved != null).length} run-removals · ${totalRemoved} run${totalRemoved !== 1 ? "s" : ""} removed in sample` : ""}
    `);
    R.notice("rr-notice", filtered.length === 0 && rows.length ? "No rows match the current filters." : "");
  }

  function downloadCSV() {
    const season = R.$("rr-season").value;
    const search = (R.$("rr-search").value || "").trim().toLowerCase();
    const mode = R.$("rr-rows").value;
    const filtered = rows.filter(r => matches(r, season, search, mode));
    const header = ["date","season","teams","batter","pitcher","play","event","inning","runners_on","runs_credited","runs_removed","play_id","clip","play_by_play","gameday","film_room","source"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push([
        r.date||"", r.season||"", r.teams||"", r.batter||"", r.pitcher||"", r.play||"", r.event||"", r.inning||"",
        r.runnersOn==null?"":r.runnersOn, r.runsCredited==null?"":r.runsCredited, r.runsRemoved==null?"":r.runsRemoved,
        r.playId||"", r.clip||"", r.pbp||"", r.gameday||"", r.filmRoom||"", r.source||""
      ].map(c => { const text = String(c); return `"${(/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`; }).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "run-removed-overturns.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { init };
})();

function esc(s){ if(s==null)return""; const d=document.createElement("div"); d.textContent=String(s); return d.innerHTML; }
