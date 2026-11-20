/* LiveScoringErrors-Pending — scoring model & correlation view */

const Model = (() => {
  function init(payload) {
    const el = R.$("model-card");
    if (!el) return;
    el.replaceChildren();

    const corr = payload.correlations || [];
    const cEl = R.$("corr-table");
    if (cEl) {
      if (!corr.length) cEl.innerHTML = '<p class="empty">No correlation study on file.</p>';
      else cEl.innerHTML = `<table class="kv">${corr.map(c => `<tr><td>${R.esc(c.metric)}</td><td>${R.esc(c.value)}</td><td>${R.esc(c.note || "")}</td></tr>`).join("")}</table>`;
    }

    const rbi = R.$("rbi-note");
    if (rbi) rbi.textContent = "No hypothetical RBI values are published.";
  }
  return { init };
})();
