window.LSP = window.LSP || {};

window.LSP.scorer = {
  data: null,

  init(data) {
    this.data = data || { rows: [] };
    const caveat = document.getElementById("sc-caveat");
    if (caveat && this.data.note) caveat.textContent = this.data.note;

    ["sc-season", "sc-state"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", () => this.render());
    });
    const search = document.getElementById("sc-search");
    if (search) search.addEventListener("input", () => this.render());

    const csvBtn = document.getElementById("sc-csv");
    if (csvBtn) {
      csvBtn.addEventListener("click", () => {
        window.LSP.render.downloadCsv(
          "scorer_plays.csv",
          ["date", "batter", "score", "sci", "ruling", "source_url"],
          (this.data && this.data.rows) || []
        );
      });
    }

    this.render();
  },

  render() {
    const R = window.LSP.render;
    const rows = (this.data && this.data.rows) || [];
    R.renderSummary("sc-summary", [
      { label: "Scored plays", value: rows.length },
      { label: "Dataset status", value: (this.data && this.data.status) || "unverified" }
    ]);
    R.setNotice("sc-notice", `${rows.length} row(s)`);
    const list = document.getElementById("sc-list");
    if (!list) return;
    if (rows.length === 0) {
      list.innerHTML = R.emptyCard(
        "No committed scored plays on file",
        (this.data && this.data.note) || "No records available.",
        (this.data && this.data.source) || "https://statsapi.mlb.com/api/v1/schedule",
        "MLB Stats API — Schedule"
      );
    }
  }
};
