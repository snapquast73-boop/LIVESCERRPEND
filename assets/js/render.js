window.LSP = window.LSP || {};

window.LSP.render = {
  esc(v) {
    if (v === null || v === undefined) return "";
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  setNotice(id, msg) {
    const node = document.getElementById(id);
    if (node) node.textContent = msg || "";
  },

  renderSummary(id, stats) {
    const node = document.getElementById(id);
    if (!node) return;
    node.innerHTML = stats
      .map(
        (s) => `
        <div class="stat">
          <div class="stat-val">${this.esc(s.value)}</div>
          <div class="stat-lbl">${this.esc(s.label)}</div>
        </div>`
      )
      .join("");
  },

  emptyCard(title, detail, sourceUrl, sourceLabel) {
    const link = sourceUrl
      ? `<p class="foot">Official source: <a href="${this.esc(sourceUrl)}" target="_blank" rel="noopener">${this.esc(sourceLabel || sourceUrl)}</a></p>`
      : "";
    return `
      <div class="row-card">
        <div class="row-head">
          <strong>${this.esc(title)}</strong>
          <span class="badge warn">unverified / empty</span>
        </div>
        <p class="muted">${this.esc(detail)}</p>
        ${link}
      </div>`;
  },

  downloadCsv(filename, headers, rows) {
    const escapeCell = (v) => {
      const s = v === null || v === undefined ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [
      headers.map(escapeCell).join(","),
      ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(","))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
