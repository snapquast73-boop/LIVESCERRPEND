/* Official outcomes only. An actual RBI is not a hypothetical RBI. */
const Scorer = (() => {
  let rows = [];
  let panel;
  const filtered = () => {
    const ruling = R.$('sc-state').value;
    const query = R.$('sc-search').value.trim().toLowerCase();
    return rows.filter(r => (!ruling || r.ruling === ruling) &&
      [r.player, r.pitcher, r.teams, r.date, r.description].join(' ').toLowerCase().includes(query));
  };
  function render() {
    const matches = filtered();
    R.list('sc-list', matches.map(r => R.card(`
      <div class="title">${R.esc(r.description || r.ruling)}</div>
      <div class="meta">${R.esc(r.date)} · ${R.esc(r.teams)} · inning ${R.esc(r.inning)}</div>
      <div class="meta">Official: ${R.esc(r.ruling)} · RBI: ${R.esc(r.rbi)} ${r.rbi == null ? '(unverified)' : ''}</div>
      ${R.link(r.pbp, 'Official play-by-play')} · ${R.link(r.schedule, 'MLB schedule')}`)));
    R.summary('sc-summary', `${matches.length} of ${rows.length} official rulings shown. No model scores.`);
    R.$('sc-csv').disabled = !matches.length;
  }
  function init() {
    const select = R.$('sc-state');
    panel = datePanel('sc', (feeds, mlb) => {
      rows = feeds.flatMap(feed => mlb.getScoredBalls(feed).map(row => ({...row,
        schedule: mlb.scheduleFor(row.date)})));
      const prior = select.value;
      select.replaceChildren(new Option('all official rulings', ''));
      const rulings = [...new Set(rows.map(r => r.ruling))].sort();
      for (const label of rulings) select.add(new Option(label, label));
      if (rulings.includes(prior)) select.value = prior;
      render();
    }, 'No current rulings available.');
    select.addEventListener('change', render);
    R.$('sc-search').addEventListener('input', render);
    R.$('sc-csv').addEventListener('click', () => {
      const fields = ['date','season','teams','gamePk','atBatIndex','player','pitcher','inning','ruling','rbi','score','sci','pbp','schedule'];
      const cell = value => {
        const text = String(value ?? '');
        return `"${(/^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? "'" : '') + text.replaceAll('"','""')}"`;
      };
      const csv = [fields.join(','), ...filtered().map(r => fields.map(k => cell(r[k])).join(','))].join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
      const a = document.createElement('a');
      a.href = url; a.download = 'official-scorer-rulings.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    render();
  }
  return {init, open: () => panel.open(), refreshToday: () => panel.refreshToday()};
})();
