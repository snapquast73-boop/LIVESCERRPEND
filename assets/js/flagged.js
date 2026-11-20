/* Flagged for Review page — renders the published audit from payload.json.
   Everything shown here is read from data/site/payload.json (written by the
   harvest); the page also carries a static summary for visitors without JS. */

(() => {
  const esc = value => {
    if (value == null) return "";
    const el = document.createElement("div");
    el.textContent = String(value);
    return el.innerHTML;
  };
  const link = (url, label) => url
    ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label || url)}</a>`
    : "";

  function table(headers, rows) {
    return `<table><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(cells => `<tr>${cells.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  fetch("data/site/payload.json", { cache: "no-store" })
    .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(payload => {
      const meta = payload.meta || {};
      const coverage = meta.coverage || {};
      const coverageEl = document.getElementById("flag-coverage");
      if (coverageEl) {
        coverageEl.innerHTML = `<p class="muted">Generated ${esc(payload.generatedAt || "—")} ·
          ${esc(meta.freshness || "")}</p>
          <ul>${Object.entries(coverage).map(([key, value]) =>
            `<li><b>${esc(key)}</b>: ${esc(value)}</li>`).join("")}</ul>`;
      }

      const scaleEl = document.getElementById("flag-scale");
      if (scaleEl) {
        const scale = meta.seasonScale || [];
        scaleEl.innerHTML = scale.length ? table(
          ["Season", "Games completed", "Games scanned", "Feeds unavailable", "Overturned reviews", "Pitch challenges", "Run removals", "Runs removed", "Candidates", "Official source"],
          scale.map(row => [
            esc(row.season), esc(row.gamesCompleted), esc(row.gamesScanned), esc(row.feedsUnavailable),
            esc(row.overturnedReviews), esc(row.pitchChallenges), esc(row.runRemovals), esc(row.runsRemoved),
            esc(row.candidates), link(row.source, "schedule")
          ])) : '<p class="empty">No harvested season is on file.</p>';
      }

      const anchorsEl = document.getElementById("flag-anchors");
      if (anchorsEl) {
        const anchors = payload.anchors || [];
        anchorsEl.innerHTML = anchors.length ? table(
          ["gamePk", "runs removed", "what was checked", "official record"],
          anchors.map(row => [
            esc(row.gamePk), esc(row.runsRemoved == null ? "—" : row.runsRemoved),
            esc(row.status || ""), link(row.pbp, "play-by-play")
          ])) : '<p class="empty">No verification anchors on file.</p>';
      }

      const irregularEl = document.getElementById("flag-irregular");
      if (irregularEl) {
        const items = meta.irregularities || [];
        irregularEl.innerHTML = items.length ? items.map(item => `
          <div class="flag ${item.unverified ? "unverified" : ""}">
            <h4>${esc(item.id || "irregularity")}${item.unverified ? " — unverified" : ""}</h4>
            <p>${esc(item.text || "")}</p>
            ${item.source ? `<p class="muted">source: ${link(item.source, item.source)}</p>` : ""}
          </div>`).join("") : '<p class="empty">Nothing flagged.</p>';
      }
    })
    .catch(error => {
      const el = document.getElementById("flag-status");
      if (el) el.textContent = `Could not load data/site/payload.json (${error.message}). The static summary on this page still applies.`;
    });
})();
