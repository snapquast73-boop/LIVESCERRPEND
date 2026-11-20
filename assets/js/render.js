/* LiveScoringErrors-Pending — shared rendering helpers */

const R = (() => {
  const esc = (s) => {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  };

  const $ = (id) => document.getElementById(id);
  const empty = (id) => { const el = $(id); if (el) el.innerHTML = ""; };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    catch (e) { return String(iso); }
  };

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return String(iso); }
  };

  const chip = (text, kind) => `<span class="chip ${kind || ""}">${esc(text)}</span>`;

  const link = (url, label) => {
    if (!url) return esc(label || "—");
    return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label || "link")}</a>`;
  };

  const pct = (n, d) => {
    if (!d) return "—";
    return ((100 * n) / d).toFixed(1) + "%";
  };

  const card = (html) => `<article class="row-card">${html}</article>`;

  const list = (containerId, itemsHtml) => {
    const el = $(containerId);
    if (!el) return;
    if (!itemsHtml || itemsHtml.length === 0) { el.innerHTML = `<p class="empty">No rows to show.</p>`; return; }
    el.innerHTML = itemsHtml.join("");
  };

  const notice = (id, text, kind) => {
    const el = $(id);
    if (!el) return;
    el.textContent = text || "";
    el.className = "notice" + (kind ? " " + kind : "");
  };

  const summary = (id, html) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = html || "";
  };

  return { esc, $, empty, fmtDate, fmtDateTime, chip, link, pct, card, list, notice, summary };
})();
