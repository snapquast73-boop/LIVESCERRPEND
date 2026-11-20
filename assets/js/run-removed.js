window.LSP = window.LSP || {};

window.LSP.runRemoved = {
  data: null,

  init(data) {
    this.data = data || { rows: [] };
    const rows = this.data.rows || [];

    const seasonSel = document.getElementById("rr-season");
    if (seasonSel) {
      const seasons = [...new Set(rows.map((r) => r.season).filter(Boolean))].sort().reverse();
      seasons.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        seasonSel.appendChild(opt);
      });
      seasonSel.addEventListener("change", () => this.render());
    }

    const search = document.getElementById("rr-search");
    if (search) search.addEventListener("input", () => this.render());

    const mode = document.getElementById("rr-rows");
    if (mode) mode.addEventListener("change", () => this.render());

    const csvBtn = document.getElementById("rr-csv");
    if (csvBtn) {
      csvBtn.addEventListener("click", () => {
        const filtered = this.filtered();
        window.LSP.render.downloadCsv(
          "run_removed.csv",
          ["date", "season", "batter", "team", "runs_removed", "source_url"],
          filtered
        );
      });
    }

    this.render();
  },

  filtered() {
    const rows = (this.data && this.data.rows) || [];
    const season = (document.getElementById("rr-season") || {}).value || "";
    const q = ((document.getElementById("rr-search") || {}).value || "").trim().toLowerCase();
    const mode = (document.getElementById("rr-rows") || {}).value || "run_removals";

    return rows.filter((r) => {
      if (mode === "run_removals" && r.kind && r.kind !== "run_removal") return false;
      if (season && String(r.season) !== season) return false;
      if (q) {
        const hay = `${r.batter || ""} ${r.team || ""} ${r.date || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },

  render() {
    const R = window.LSP.render;
    const rows = this.filtered();
    R.renderSummary("rr-summary", [
      { label: "Run-removed plays", value: rows.length },
      { label: "Dataset status", value: (this.data && this.data.status) || "unverified" }
    ]);
    R.setNotice("rr-notice", `${rows.length} row(s)`);

    const list = document.getElementById("rr-list");
    if (!list) return;
    if (rows.length === 0) {
      list.innerHTML = R.emptyCard(
        "No harvested run-removed plays on file",
        (this.data && this.data.note) || "No records available.",
        (this.data && this.data.source) || "https://statsapi.mlb.com/api/v1/schedule",
        "MLB Stats API — Schedule"
      );
      return;
    }

    list.innerHTML = rows
      .map(
        (r) => `
      <div class="row-card">
        <div class="row-head">
          <strong>${R.esc(r.batter || "Unknown")} (${R.esc(r.team || "—")}) — ${R.esc(r.date || "—")}</strong>
          <span class="badge ok">${R.esc(r.runs_removed)} run(s) removed</span>
        </div>
        <p class="muted">${R.esc(r.description || "")}</p>
        <p class="foot">
          ${r.source_url ? `<a href="${R.esc(r.source_url)}" target="_blank" rel="noopener">Official play-by-play</a>` : ""}
          ${r.video_url ? ` · <a href="${R.esc(r.video_url)}" target="_blank" rel="noopener">Watch clip</a>` : ""}
        </p>
      </div>`
      )
      .join("");
  }
};
