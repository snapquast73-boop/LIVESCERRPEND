/* LiveScoringErrors-Pending — live scorer (0–100) view */

const Scorer = (() => {
  let rows = [];

  function init(payload) {
    rows = (payload.scorer || []).slice();
    render();
    wire();
  }

  function wire() {
    const run = () => render();
    for (const id of ["sc-season", "sc-state", "sc-search"]) {
      const el = R.$(id);
      if (el) el.addEventListener(id === "sc-search" ? "input" : "change", run);
    }
    const btn = R.$("sc-csv");
    if (btn) btn.addEventListener("click", downloadCSV);
  }

  function render() {
    const season = R.$("sc-season").value;
    const state = R.$("sc-state").value;
    const search = (R.$("sc-search").value || "").trim().toLowerCase();
    const filtered = rows.filter(r => {
      if (season && r.season !== season) return false;
      if (state === "reached" && !r.reached) return false;
      if (state === "disagree" && !r.disagree) return false;
      if (state === "low") {
        const sci = Number(r.sci);
        if (!sci && sci !== 0) return false;
        if (sci >= 50) return false;
      }
      if (search) {
        const hay = [r.batter, r.pitcher, r.teams, r.date, r.ruling].join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    });
    const html = filtered.map(r => R.card(`
      <div class="title">${esc(r.batter || "Batter")} · ${esc(r.date || "—")}</div>
      <div class="meta">${esc(r.teams || "—")} · ${esc(r.season || "—")} · inning ${esc(r.inning || "—")}</div>
      <div class="meta">official: <b>${esc(r.ruling || "—")}</b> · model top: <b>${esc(r.topClass || "—")}</b> (${esc(r.score || "—")})</div>
      <div class="meta">SCI: <b>${esc(r.sci == null ? "—" : r.sci)}</b> ${r.sci == null ? "(out — no SCI)" : ""}</div>
      <div class="meta">RBI under error: <b>${esc(r.rbiError || "—")}</b> · under hit/FC: <b>${esc(r.rbiHitFC || "—")}</b> ${r.rbiJudgment ? R.chip("scorer judgment", "warn") : ""}</div>
      <div style="margin-top:0.35rem">${R.link(r.pbp, "official play-by-play")} ${r.clip ? R.link(r.clip, "watch clip") : ""}</div>
    `)).join("");
    R.list("sc-list", html ? [`<div class="cards">${html}</div>`] : null);
    const sciCount = rows.filter(r => r.sci != null).length;
    R.summary("sc-summary", `${filtered.length} play${filtered.length !== 1 ? "s" : ""} shown · ${sciCount} with SCI.`);
    R.notice("sc-notice", filtered.length === 0 && rows.length ? "No plays match the current filters." : "");
  }

  function downloadCSV() {
    const season = R.$("sc-season").value;
    const state = R.$("sc-state").value;
    const search = (R.$("sc-search").value || "").trim().toLowerCase();
    const filtered = rows.filter(r => {
      if (season && r.season !== season) return false;
      if (state === "reached" && !r.reached) return false;
      if (state === "disagree" && !r.disagree) return false;
      if (state === "low") {
        const sci = Number(r.sci);
        if (!sci && sci !== 0) return false;
        if (sci >= 50) return false;
      }
      if (search) {
        const hay = [r.batter, r.pitcher, r.teams, r.date, r.ruling].join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    });
    const header = ["date","season","teams","batter","pitcher","inning","ruling","top_class","score","sci","reached","rbi_error","rbi_hit_fc","rbi_judgment","play_by_play","clip"];
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push([r.date||"", r.season||"", r.teams||"", r.batter||"", r.pitcher||"", r.inning||"", r.ruling||"", r.topClass||"", r.score||"", r.sci==null?"":r.sci, r.reached?"yes":"no", r.rbiError||"", r.rbiHitFC||"", r.rbiJudgment?"yes":"no", r.pbp||"", r.clip||""].map(c => `"${String(c).replace(/"/g,'""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "scorer-0-100.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function esc(s) { return R.esc(s); }
  return { init };
})();
