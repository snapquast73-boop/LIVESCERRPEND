/* LiveScoringErrors-Pending — scoring model & correlation view.
   The model itself, its training data and its holdout metrics were not part of
   the upload, so this view reports only what the repository can state: that the
   model is absent, and which official rule text governs the RBI question. */

const Model = (() => {
  function init(payload) {
    const model = payload.model || {};
    const el = R.$("model-card");
    if (el) {
      const rows = [
        ["Status", model.status || "unverified"],
        ["Model type", model.model_type || "not trained in this repository"],
        ["Held-out accuracy", model.held_out_accuracy || "not produced"],
        ["Rule 9.04 RBI note", model.rbi_rule || "—"],
      ];
      el.innerHTML = `<table class="kv">
        <tr><th>Field</th><th>Value</th></tr>
        ${rows.map(([name, value]) => `<tr><td>${R.esc(name)}</td><td>${R.esc(value)}</td></tr>`).join("")}
        ${model.source ? `<tr><td>Official rule source</td><td>${R.link(model.source, model.source)}</td></tr>` : ""}
      </table>`;
    }

    const corr = payload.correlations || [];
    const cEl = R.$("corr-table");
    if (cEl) {
      cEl.innerHTML = corr.length
        ? `<table class="kv"><tr><th>Metric</th><th>Value</th><th>Note</th></tr>${corr.map(row =>
            `<tr><td>${R.esc(row.metric)}</td><td>${R.esc(row.value)}</td><td>${R.esc(row.note || "")}</td></tr>`).join("")}</table>`
        : '<p class="empty">No correlation study is included in this repository, so none is published.</p>';
    }

    const rbi = R.$("rbi-note");
    if (rbi) {
      rbi.innerHTML = model.rbi_rule
        ? `<p>${R.esc(model.rbi_rule)}</p>
           <p class="muted">${model.source ? R.link(model.source, "Official Baseball Rules (MLB, PDF)") : ""}
           — the scorer's judgment decides the rest; this site does not publish a hypothetical RBI value.</p>`
        : "No hypothetical RBI values are published.";
    }
  }
  return { init };
})();
