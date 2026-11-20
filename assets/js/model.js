/* LiveScoringErrors-Pending — scoring model & correlation view */

const Model = (() => {
  function init(payload) {
    const m = payload.model || {};
    const el = R.$("model-card");
    if (!el) return;
    const rows = [
      ["Training rows", m.trainRows || "—"],
      ["Holdout rows", m.holdoutRows || "—"],
      ["Holdout accuracy (4-way)", m.holdoutAccuracy || "—"],
      ["Holdout log-loss", m.holdoutLogLoss || "—"],
      ["SCI calibration (reached-only)", m.sciCalibration || "not regenerated — see LIM-5"],
      ["Live feature set", m.liveFeatures || "experimental — xBA/xwOBA/alignment not populated live (LIM-6)"],
      ["Last trained", m.trainedAt || "—"]
    ];
    el.innerHTML = rows.map(([k, v]) => `<tr><td>${R.esc(k)}</td><td>${R.esc(v)}</td></tr>`).join("");

    const corr = payload.correlations || [];
    const cEl = R.$("corr-table");
    if (cEl) {
      if (!corr.length) cEl.innerHTML = '<p class="empty">No correlation study on file.</p>';
      else cEl.innerHTML = `<table class="kv">${corr.map(c => `<tr><td>${R.esc(c.metric)}</td><td>${R.esc(c.value)}</td><td>${R.esc(c.note || "")}</td></tr>`).join("")}</table>`;
    }

    const rbi = R.$("rbi-note");
    if (rbi) rbi.innerHTML = `<p class="foot">${R.esc(payload.meta && payload.meta.irregularities ? "" : "")}</p><p class="foot">Rule 9.04(a)(3): error → RBI exception when, before two are out, a runner from third would ordinarily have scored. The engine returns a range where the feed does not establish those facts — scorer judgment, not data.</p>`;
  }
  return { init };
})();
