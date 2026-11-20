window.LSP = window.LSP || {};

window.LSP.model = {
  init(modelMeta, siteMeta, flaggedData) {
    const R = window.LSP.render;

    const card = document.getElementById("model-card");
    if (card && modelMeta) {
      card.innerHTML = `
        <tr><th>Status</th><td><span class="badge warn">${R.esc(modelMeta.status || "unverified")}</span></td></tr>
        <tr><th>Model type</th><td>${R.esc(modelMeta.model_type || "—")}</td></tr>
        <tr><th>Held-out accuracy</th><td>${R.esc(modelMeta.held_out_accuracy || "—")}</td></tr>
        <tr><th>Official rules</th><td><a href="${R.esc(modelMeta.source || "#")}" target="_blank" rel="noopener">2026 Official Baseball Rules (PDF)</a></td></tr>
      `;
    }

    const corr = document.getElementById("corr-table");
    if (corr) {
      const items = (modelMeta && modelMeta.correlations) || [];
      corr.innerHTML =
        items.length === 0
          ? `<p class="muted">No correlation table published yet (unverified).</p>`
          : `<p class="muted">${items.length} correlation entries.</p>`;
    }

    const rbi = document.getElementById("rbi-note");
    if (rbi && modelMeta) {
      rbi.innerHTML = `<p class="muted">${R.esc(modelMeta.rbi_rule || "")}</p>`;
    }

    const anchorEl = document.getElementById("anchor-table");
    if (anchorEl && siteMeta) {
      const anchors = siteMeta.anchors || [];
      anchorEl.innerHTML =
        anchors.length === 0
          ? `<p class="muted">No verification anchors harvested yet (sandbox has no outbound access to statsapi.mlb.com).</p>`
          : `<p class="muted">${anchors.length} anchor(s) verified.</p>`;
    }

    const metaEl = document.getElementById("meta-table");
    if (metaEl && siteMeta) {
      const irr = siteMeta.irregularities || [];
      metaEl.innerHTML = `
        <p><strong>Coverage:</strong> ${R.esc(siteMeta.coverage || "—")}</p>
        ${irr.length ? `<ul>${irr.map((i) => `<li>${R.esc(i)}</li>`).join("")}</ul>` : ""}
      `;
    }

    const flaggedEl = document.getElementById("flagged-list");
    if (flaggedEl && flaggedData) {
      const items = flaggedData.items || [];
      flaggedEl.innerHTML = items
        .map(
          (item) => `
        <div class="row-card">
          <div class="row-head">
            <strong>${R.esc(item.id)} — ${R.esc(item.area)}</strong>
            <span class="badge ${item.status === "verified_reference" ? "ok" : "warn"}">${R.esc(item.status)}</span>
          </div>
          <p class="muted">${R.esc(item.description)}</p>
          <p class="foot">Source: <a href="${R.esc(item.source_url)}" target="_blank" rel="noopener">${R.esc(item.source_label || item.source_url)}</a></p>
        </div>`
        )
        .join("");
    }
  }
};
