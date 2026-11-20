/* A date lookup starts on the first visit, never while its tab is hidden. */
function datePanel(prefix, display, fallbackText) {
  const form = R.$(`${prefix}-scan`);
  const input = R.$(`${prefix}-date`);
  const button = form.querySelector('button');
  const status = R.$(`${prefix}-scan-status`);
  let started = false;
  let busy = false;
  let lastDate;
  let followToday = true;

  async function scan() {
    if (busy) return;
    started = busy = true;
    input.disabled = button.disabled = true;
    status.textContent = 'Checking official MLB play-by-play…';
    try {
      const mlb = await API.mlb;
      input.max = mlb.easternDate();
      if (!input.value) input.value = input.max;
      const date = lastDate = input.value;
      followToday = date === input.max;
      const result = await mlb.scanDate(date, false);
      display(result.feeds, mlb);
      status.innerHTML = `${R.esc(date)} (ET): ${result.feeds.length} of ${result.scheduled} eligible feeds checked. ${R.link(mlb.scheduleFor(date), 'MLB schedule')}` +
        (result.failed.length ? ` · Unavailable: ${result.failed.map(id => R.link(mlb.playByPlay(id), `game ${id}`)).join(', ')}` : '');
    } catch {
      display([], null);
      status.textContent = `MLB lookup unavailable. ${fallbackText}`;
    } finally {
      input.disabled = button.disabled = busy = false;
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); scan(); });
  return {open() { if (!started) scan(); }, async refreshToday() {
    const mlb = await API.mlb;
    if (busy || !followToday || input.value !== lastDate || document.activeElement === input) return;
    input.max = input.value = mlb.easternDate();
    scan();
  }};
}
