/* LiveScoringErrors-Pending — app shell: tabs, status, anchors, meta, init */

const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");
const statusEl = document.getElementById("status");
const footerMeta = document.getElementById("footer-meta");

let initialized = false;

function show(viewId, updateURL = false) {
  views.forEach(v => v.classList.toggle("is-active", v.id === `view-${viewId}`));
  tabs.forEach(t => {
    const active = t.dataset.view === viewId;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", String(active));
    t.tabIndex = active ? 0 : -1;
  });
  if (updateURL) history.replaceState(null, "", `#${viewId}`);
  if (initialized && viewId === "reviews") Reviews.open();
  if (initialized && viewId === "scorer") Scorer.open();
  if (initialized && viewId === "pending") Pending.refreshLive();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => show(tab.dataset.view, true));
  tab.addEventListener("keydown", event => {
    const next = {ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0, End: tabs.length - 1}[event.key];
    if (next == null) return;
    event.preventDefault();
    tabs[next].focus();
    show(tabs[next].dataset.view, true);
  });
});
function openHash() {
  const current = [...tabs].find(tab => `#${tab.dataset.view}` === location.hash);
  if (current) show(current.dataset.view);
}
window.addEventListener("hashchange", openHash);

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
      <td>${R.esc(a.runsRemoved == null ? "" : a.runsRemoved)}</td>
      <td>${R.esc(a.status || "—")}</td>
      <td>${R.link(a.pbp, "Play-by-play")} ${a.clip ? R.link(a.clip, "Official clip") : ""}</td>
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
  setFooter(`Verified sample · ${payload.run_removed ? payload.run_removed.length : 0} run-removals · ${payload.decisions ? payload.decisions.length : 0} scorer entries`);

  RunRemoved.init(payload);
  Pending.init(payload);
  Reviews.init(payload);
  DecisionChanges.init(payload);
  Scorer.init(payload);
  Model.init(payload);

  renderAnchors(payload.anchors);
  renderMeta(payload.meta);

  initialized = true;
  openHash();
  setInterval(() => {
    if (!document.hidden && R.$("view-reviews").classList.contains("is-active")) Reviews.refreshToday();
    if (!document.hidden && R.$("view-scorer").classList.contains("is-active")) Scorer.refreshToday();
    if (!document.hidden && R.$("view-pending").classList.contains("is-active")) Pending.refreshLive();
  }, 60000);
});

// initial load
API.load().then(() => {
  setStatus("Data loaded.", "ok");
}).catch((error) => {
  console.error("Site initialization failed:", error);
  setStatus("Data unavailable — showing empty shell.", "warn");
});
