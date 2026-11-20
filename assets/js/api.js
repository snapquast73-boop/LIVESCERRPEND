window.LSP = window.LSP || {};

window.LSP.api = {
  async fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${path}`);
    }
    return res.json();
  },

  async fetchLiveSchedule(dateStr) {
    const d = dateStr || new Date().toISOString().slice(0, 10);
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(d)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MLB schedule API returned HTTP ${res.status}`);
    }
    return res.json();
  },

  async fetchLivePlayByPlay(gamePk) {
    const url = `https://statsapi.mlb.com/api/v1/game/${encodeURIComponent(gamePk)}/playByPlay`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MLB playByPlay API returned HTTP ${res.status}`);
    }
    return res.json();
  }
};
