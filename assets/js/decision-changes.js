window.LSP = window.LSP || {};

window.LSP.decisionChanges = {
  data: null,

  init(data) {
    this.data = data || { rows: [] };
    const tr = document.getElementById("dc-transition");
    if (tr) tr.addEventListener("change", () => this.render());
    const rbi = document.getElementById("dc-rbi");
    if (rbi) rbi.addEventListener("change", () => this.render());
    this.render();
  },

  render() {
    const R = window.LSP.render;
    const rows = (this.data && this.data.rows) || [];
    R.renderSummary("dc-summary", [
      { label: "Scoring changes", value: rows.length },
      { label: "Dataset status", value: (this.data && this.data.status) || "unverified" }
    ]);
    R.setNotice("dc-notice", `${rows.length} row(s)`);
    const list = document.getElementById("dc-list");
    if (!list) return;
    if (rows.length === 0) {
      list.innerHTML = R.emptyCard(
        "No harvested official scoring-change bulletins on file",
        (this.data && this.data.note) || "No records available.",
        (this.data && this.data.source) || "https://www.mlb.com/official-information/scoring-changes",
        "MLB — Official Scoring Changes"
      );
    }
  }
};
