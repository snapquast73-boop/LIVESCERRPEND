/* LiveScoringErrors-Pending — app shell: tabs, status, anchors, meta, init */

const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");
const statusEl = document.getElementById("status");
const footerMeta = document.getElementById("footer-meta");

function show(viewId) {
  views.forEach(v => v.classList.toggle("is-active", v.id === `view-${viewId}`));
  tabs.forEach(t => {
    const active = t.dataset.view === viewId;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

tabs.forEach(t => t.addEventListener("click", () => show(t.dataset.view)));

function setStatus(msg, kind) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = kind || "";
}

function setFooter(text) {
  if (!footerMeta) return;
  footerMeta.textContent = text;
}

function renderAnchors(anchors) {
  const el = R.$("anchor-table");
  if (!el) return;
  if (!anchors || !anchors.length) { el.innerHTML = '<p class="empty">No verification anchors on file.</p>'; return; }
  el.innerHTML = `<table class="kv">
    <tr><td>gamePk</td><td>runs removed (published)</td><td>re-fetched</td><td>official play-by-play</td></tr>
    ${anchors.map(a => `<tr>
      <td>${R.esc(a.gamePk)}</td>
      <td>${R.esc(a.runsRemoved == null ? "—" : a.runsRemoved)}</td>
      <td>${R.esc(a.status || "—")}</td>
      <td>${R.link(a.pbp, "view")}</td>
    </tr>`).join("")}
  </table>`;
}

function renderMeta(meta) {
  const el = R.$("meta-table");
  if (!el) return;
  if (!meta) { el.innerHTML = '<p class="empty">No coverage metadata on file.</p>'; return; }
  const cov = meta.coverage || {};
  const irr = meta.irregularities || [];
  let covHtml = "<ul>";
  for (const k of Object.keys(cov)) covHtml += `<li><b>${R.esc(k)}:</b> ${R.esc(cov[k])}</li>`;
  covHtml += "</ul>";
  let irrHtml = irr.map(i => `<div class="flag ${i.unverified ? "unverified" : ""}">
    <h4>${R.esc(i.id || "irregularity")}</h4>
    <p>${R.esc(i.text || "")}</p>
    ${i.source ? `<p style="margin-top:0.2rem;font-size:0.75rem">source: ${R.link(i.source, "view")}</p>` : ""}
  </div>`).join("");
  el.innerHTML = `<div>${covHtml}</div><div style="margin-top:0.8rem"><b>Flagged / unverified:</b> ${irr.length ? irrHtml : '<p class="empty">None flagged.</p>'}</div>`;
}

API.onLoad((payload) => {
  setStatus("Data loaded.", "ok");
  setFooter(`Generated ${payload.generatedAt ? R.fmtDateTime(payload.generatedAt) : "—"} · ${payload.run_removed ? payload.run_removed.length : 0} run-removals · ${payload.decisions ? payload.decisions.length : 0} scorer entries`);

  RunRemoved.init(payload);
  Pending.init(payload);
  Reviews.init(payload);
  DecisionChanges.init(payload);
  Scorer.init(payload);
  Model.init(payload);

  renderAnchors(payload.anchors);
  renderMeta(payload.meta);

  show("run-removed");
});

// initial load
API.load().then(() => {
  setStatus("Data loaded.", "ok");
}).catch(() => {
  setStatus("Data unavailable — showing empty shell.", "warn");
});
