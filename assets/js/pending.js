/* LiveScoringErrors-Pending — pending rulings view */

const Pending = (() => {
  let payload = null;
  let running = false;

  function init(p) {
    payload = p;
    renderHistory();
    wire();
  }

  function wire() {
    const btn = R.$("pend-refresh");
    if (btn) btn.addEventListener("click", refreshLive);
    const sel = R.$("pend-season");
    const search = R.$("pend-search");
    const run = () => renderHistory();
    if (sel) sel.addEventListener("change", run);
    if (search) search.addEventListener("input", run);
  }

  async function refreshLive() {
    if (running) return;
    running = true;
    R.$("pend-refresh").disabled = true;
    const notice = R.$("pend-notice");
    const liveBox = R.$("pend-live");
    notice.textContent = "Contacting the official feed…";
    liveBox.innerHTML = '<p class="loading">Checking today\'s games for pending rulings…</p>';
    try {
      const result = await API.fetchLivePending();
      if (!result.live || result.live.length === 0) {
        liveBox.innerHTML = `<p class="empty">${result.failed.length ? "No pending markers in responding feeds; coverage is incomplete." : "No pending markers in the live feeds checked."}</p>`;
      } else {
        const html = result.live.map(x => R.card(`
          <div class="title">${esc(x.description || "Pending ruling")}</div>
          <div class="meta">Game ${esc(x.gamePk)}${x.batter ? ` · ${esc(x.batter)}` : ""}</div>
          <div class="meta">${esc(x.eventType)} · ${esc(x.eventType === "os_ruling_pending_primary" ? "primary" : "prior")}</div>
          <div style="margin-top:0.35rem">${R.link(x.pbp, "official play-by-play")} ${R.link(x.clip, "watch clip")}</div>
        `)).join("");
        liveBox.innerHTML = `<div class="cards">${html}</div>`;
      }
      notice.innerHTML = `${esc(result.note)} ${R.link(result.schedule, "Official MLB schedule")}` +
        (result.failed.length ? ` · Unavailable: ${result.failed.map(url => R.link(url, "game feed")).join(", ")}` : "");
    } catch (err) {
      liveBox.innerHTML = `<p class="empty">Live read failed: ${esc(String(err))}</p>`;
      R.notice("pend-notice", "Live feed unavailable.");
    } finally {
      running = false;
      R.$("pend-refresh").disabled = false;
    }
  }

  function renderHistory() {
    if (!payload) return;
    const pend = payload.pending || {};
    const dist = pend.distribution || [];
    const cases = pend.cases || [];

    // distribution bars
    const total = dist.reduce((a, b) => a + (Number(b.n) || 0), 0);
    let distHtml = "";
    if (total > 0) {
      distHtml = dist.map(d => {
        const n = Number(d.n) || 0;
        const w = total ? (100 * n / total) : 0;
        return `<div class="dist"><div class="fill" style="width:${w}%"></div><div class="label">${esc(d.ruling)} ${n} / ${total} (${pct(n, total)})</div></div>`;
      }).join("");
    } else {
      distHtml = `<p class="empty">${pend.note || "No pending-ruling history on file."}</p>`;
    }
    R.$("pend-dist").innerHTML = distHtml;
    const foot = total > 0
      ? `Sample size n = ${total}. ${esc(pend.note || "")}`
      : esc(pend.note || "No cases captured yet. The post-game harvest finds zero pending markers because the archive replaces them with the corrected call; only live polling captures them.");
    R.$("pend-model-foot").innerHTML = `<p class="foot">${foot}</p>`;
    R.summary("pend-model-summary", `Pending rulings resolved to: ${total} case${total !== 1 ? "s" : ""} on file.`);

    // cases list
    const season = R.$("pend-season").value;
    const search = (R.$("pend-search").value || "").trim().toLowerCase();
    const filtered = cases.filter(c => {
      if (season && c.season !== season) return false;
      if (search) {
        const hay = [c.batter, c.pitcher, c.teams, c.date, c.resolvedTo].join(" | ").toLowerCase();
        return hay.includes(search);
      }
      return true;
    });
    const seasons = [...new Set(cases.map(c => c.season).filter(Boolean))].sort();
    fillSeason("pend-season", seasons);

    const html = filtered.map(c => R.card(`
      <div class="title">${esc(c.play || "Pending case")}</div>
      <div class="meta">${esc(c.date || "—")} · ${esc(c.teams || "—")} · ${esc(c.season || "—")}</div>
      <div class="meta">first seen ${esc(fmtDate(c.first_seen))} · last seen ${esc(fmtDate(c.last_seen))}</div>
      <div class="meta">resolved to: <b>${esc(c.resolvedTo || "—")}</b> ${c.rbi ? `· RBI ${esc(c.rbi)}` : ""}</div>
      <div style="margin-top:0.35rem">${R.link(c.pbp, "official play-by-play")} ${c.clip ? R.link(c.clip, "watch clip") : ""}</div>
    `)).join("");
    R.list("pend-list", html ? [`<div class="cards">${html}</div>`] : null);
    R.notice("pend-list-notice", filtered.length === 0 && cases.length ? "No cases match the current filters." : "");
  }

  function fillSeason(id, seasons) {
    const el = R.$(id);
    if (!el) return;
    const had = el.value;
    el.innerHTML = '<option value="">all</option>';
    for (const s of seasons) el.add(new Option(s, s));
    el.value = had;
  }

  function fmtDate(iso) { return R.fmtDate(iso); }
  function pct(n, d) { return R.pct(n, d); }
  function esc(s) { return R.esc(s); }

  return { init, refreshLive };
})();
