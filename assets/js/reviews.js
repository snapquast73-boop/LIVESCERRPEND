window.LSP = window.LSP || {};

window.LSP.reviews = {
  data: null,

  init(data) {
    this.data = data || { rows: [] };
    ["rv-season", "rv-type"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", () => this.render());
    });
    const search = document.getElementById("rv-search");
    if (search) search.addEventListener("input", () => this.render());
    this.render();
  },

  render() {
    const R = window.LSP.render;
    const rows = (this.data && this.data.rows) || [];
    R.renderSummary("rv-summary", [
      { label: "Overturned reviews", value: rows.length },
      { label: "Dataset status", value: (this.data && this.data.status) || "unverified" }
    ]);
    R.setNotice("rv-notice", `${rows.length} row(s)`);
    const list = document.getElementById("rv-list");
    if (!list) return;
    if (rows.length === 0) {
      list.innerHTML = R.emptyCard(
        "No harvested replay overturns on file",
        (this.data && this.data.note) || "No records available.",
        (this.data && this.data.source) || "https://statsapi.mlb.com/api/v1/reviewReasons",
        "MLB Stats API — Review Reasons"
      );
    }
  }
};
