window.LSP = window.LSP || {};

(async function bootstrap() {
  const tabs = document.querySelectorAll(".tab[data-view]");
  const views = document.querySelectorAll(".view");

  function activateTab(viewName) {
    tabs.forEach((t) => {
      const active = t.getAttribute("data-view") === viewName;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    views.forEach((v) => {
      v.classList.toggle("is-active", v.id === `view-${viewName}`);
    });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      const v = t.getAttribute("data-view");
      if (v) activateTab(v);
    });
  });

  const statusEl = document.getElementById("status");
  const footerMeta = document.getElementById("footer-meta");

  try {
    const api = window.LSP.api;
    const [rr, pend, rv, dc, sc, modelMeta, siteMeta, flaggedData] = await Promise.all([
      api.fetchJson("data/run_removed.json"),
      api.fetchJson("data/capture/pending_live.json"),
      api.fetchJson("data/reviews.json"),
      api.fetchJson("data/decision_changes.json"),
      api.fetchJson("data/scorer_plays.json"),
      api.fetchJson("data/model_meta.json"),
      api.fetchJson("data/meta.json"),
      api.fetchJson("data/flagged.json")
    ]);

    window.LSP.runRemoved.init(rr);
    window.LSP.pending.init(pend);
    window.LSP.reviews.init(rv);
    window.LSP.decisionChanges.init(dc);
    window.LSP.scorer.init(sc);
    window.LSP.model.init(modelMeta, siteMeta, flaggedData);

    if (statusEl) statusEl.textContent = "ready (live MLB API available in browser)";
    if (footerMeta) footerMeta.textContent = "snapquast73-boop/LIVESCERRPEND · GitHub Pages";
  } catch (err) {
    if (statusEl) statusEl.textContent = `data load error: ${err.message}`;
  }
})();
