window.LSP = window.LSP || {};

window.LSP.pending = {
  data: null,

  init(data) {
    this.data = data || { cases: [] };
    const btn = document.getElementById("pend-refresh");
    if (btn) btn.addEventListener("click", () => this.refreshLive());

    const seasonSel = document.getElementById("pend-season");
    if (seasonSel) {
      const cases = this.data.cases || [];
      [...new Set(cases.map((c) => c.season).filter(Boolean))].sort().reverse().forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        seasonSel.appendChild(opt);
      });
      seasonSel.addEventListener("change", () => this.renderArchive());
    }

    const search = document.getElementById("pend-search");
    if (search) search.addEventListener("input", () => this.renderArchive());

    this.renderArchive();
  },

  async refreshLive() {
    const R = window.LSP.render;
    const liveBox = document.getElementById("pend-live");
    R.setNotice("pend-notice", "Querying statsapi.mlb.com…");
    try {
      const sched = await window.LSP.api.fetchLiveSchedule();
      const dates = sched.dates || [];
      const games = dates.flatMap((d) => d.games || []);
      const activeGames = games.filter(
        (g) => g.status && (g.status.abstractGameState === "Live" || g.status.abstractGameState === "Final")
      );

      const pendingPlays = [];
      for (const g of activeGames.slice(0, 15)) {
        try {
          const pbp = await window.LSP.api.fetchLivePlayByPlay(g.gamePk);
          const allPlays = pbp.allPlays || [];
          for (const p of allPlays) {
            const ev = (p.result && p.result.eventType) || "";
            if (ev === "os_ruling_pending_primary" || ev === "os_ruling_pending_prior") {
              pendingPlays.push({
                gamePk: g.gamePk,
                away: g.teams && g.teams.away && g.teams.away.team && g.teams.away.team.name,
                home: g.teams && g.teams.home && g.teams.home.team && g.teams.home.team.name,
                eventType: ev,
                description: (p.result && p.result.description) || ""
              });
            }
          }
        } catch (_) {
          // Skip individual game fetch errors
        }
      }

      R.setNotice("pend-notice", `Checked ${activeGames.length} game(s); found ${pendingPlays.length} pending ruling(s).`);
      if (liveBox) {
        if (pendingPlays.length === 0) {
          liveBox.innerHTML = R.emptyCard(
            "No live pending official-scorer rulings right now",
            `Checked ${activeGames.length} live/final MLB game(s) today via statsapi.mlb.com.`,
            "https://statsapi.mlb.com/api/v1/eventTypes",
            "MLB Stats API — Event Types"
          );
        } else {
          liveBox.innerHTML = pendingPlays
            .map(
              (p) => `
            <div class="row-card">
              <div class="row-head">
                <strong>${R.esc(p.away)} @ ${R.esc(p.home)}</strong>
                <span class="badge warn">${R.esc(p.eventType)}</span>
              </div>
              <p class="muted">${R.esc(p.description)}</p>
              <p class="foot"><a href="https://statsapi.mlb.com/api/v1/game/${R.esc(p.gamePk)}/playByPlay" target="_blank" rel="noopener">Official play-by-play</a></p>
            </div>`
            )
            .join("");
        }
      }
    } catch (err) {
      R.setNotice("pend-notice", `Live fetch failed: ${err.message}`);
      if (liveBox) {
        liveBox.innerHTML = R.emptyCard(
          "Could not reach statsapi.mlb.com from this browser/network",
          err.message,
          "https://statsapi.mlb.com/api/v1/schedule",
          "MLB Stats API — Schedule"
        );
      }
    }
  },

  renderArchive() {
    const R = window.LSP.render;
    const cases = (this.data && this.data.cases) || [];
    const summaryEl = document.getElementById("pend-model-summary");
    if (summaryEl) {
      summaryEl.textContent =
        cases.length > 0
          ? `${cases.length} harvested pending case(s) on file.`
          : "No harvested pending cases on file yet (unverified).";
    }
    R.setNotice("pend-list-notice", `${cases.length} case(s)`);
    const list = document.getElementById("pend-list");
    if (!list) return;
    if (cases.length === 0) {
      list.innerHTML = R.emptyCard(
        "No archived pending rulings on file",
        (this.data && this.data.note) || "Use 'Refresh live' above to query statsapi.mlb.com directly.",
        (this.data && this.data.source) || "https://statsapi.mlb.com/api/v1/eventTypes",
        "MLB Stats API — Event Types"
      );
    }
  }
};
