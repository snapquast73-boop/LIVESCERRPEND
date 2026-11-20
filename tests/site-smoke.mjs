/**
 * Headless smoke test for the published pages.
 *
 * Loads index.html and reviews.html in jsdom with the real assets and the real
 * data/site/*.json files, stubs only the network (the MLB API module), and
 * checks that every view renders, filters and counts without throwing.
 *
 *   npm install --no-save jsdom
 *   node tests/site-smoke.mjs
 */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {JSDOM, VirtualConsole} from 'jsdom';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = file => readFile(path.join(ROOT, file), 'utf8');
const failures = [];
const check = (condition, message) => {
  if (condition) return;
  failures.push(message);
  console.error(`  ✗ ${message}`);
};
const ok = message => console.log(`  ✓ ${message}`);

const payload = JSON.parse(await read('data/site/payload.json'));
const reviewsSeries = [];
for (const series of payload.reviewSeries || []) {
  reviewsSeries.push(JSON.parse(await read(series.url)));
}

const MLB_STUB = `
globalThis.stub = {
  easternDate: () => '2026-11-20',
  scheduleFor: date => 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=' + date,
  playByPlay: id => 'https://statsapi.mlb.com/api/v1/game/' + id + '/playByPlay',
  reviewReasonsUrl: () => 'https://statsapi.mlb.com/api/v1/reviewReasons',
  getPending: () => [],
  getReviews: () => [],
  scanDate: async () => ({feeds: [], failed: [], scheduled: 0}),
  scanReviews: async () => ({
    feeds: [{game: {gamePk: 823616, status: {abstractGameState: 'Live'}}, plays: []}],
    failed: [], scheduled: 1,
    rows: [{
      gamePk: 823616, atBatIndex: 63, eventIndex: null, date: '2026-06-13', season: '2026',
      teams: 'Atlanta Braves @ New York Mets', batter: 'Juan Soto', pitcher: null, inning: 9,
      half: 'bottom', event: 'double', description: 'Umpire reviewed (home run), call on the field was overturned: Juan Soto doubles.',
      runsCredited: 1, reviewType: 'NH', inProgress: false, overturned: true, isPitch: false,
      reasonCode: 'H', reason: 'Home run', playId: 'abc-123'
    }, {
      gamePk: 823616, atBatIndex: 16, eventIndex: 0, date: '2026-06-13', season: '2026',
      teams: 'Atlanta Braves @ New York Mets', batter: 'Mauricio Dubon', pitcher: null, inning: 3,
      half: 'top', event: 'single', description: 'Ball', runsCredited: 0, reviewType: 'MJ',
      inProgress: false, overturned: true, isPitch: true, reasonCode: 'J', reason: 'Pitch result',
      playId: 'def-456'
    }]
  })
};
`;

async function loadPage(file, scripts, {transform = code => code} = {}) {
  const html = await read(file);
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    if (!String(error.message).includes('Could not load')) console.error('  jsdom error:', error.message);
  });
  const dom = new JSDOM(html, {url: `https://snapquast73-boop.github.io/LIVESCERRPEND/${file}`, virtualConsole,
    pretendToBeVisual: true, runScripts: 'outside-only'});
  const {window} = dom;
  window.fetch = async url => {
    const target = String(url).replace('https://snapquast73-boop.github.io/LIVESCERRPEND/', '');
    try {
      const body = await read(target);
      return {ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body};
    } catch {
      return {ok: false, status: 404, json: async () => ({})};
    }
  };
  window.eval(MLB_STUB);
  const sources = [];
  for (const script of scripts) {
    let code = await read(script);
    code = transform(code);
    if (script.endsWith('api.js')) code = code.replace('import("./mlb.js")', 'Promise.resolve(stub)');
    sources.push(code);
  }
  // One eval keeps the scripts' top-level const bindings visible to each other,
  // exactly as separate <script> tags do in a browser.
  window.eval(sources.join('\n;\n'));
  await new Promise(resolve => setTimeout(resolve, 400));
  return dom;
}

console.log('index.html');
{
  const dom = await loadPage('index.html', [
    'assets/js/render.js', 'assets/js/api.js', 'assets/js/run-removed.js', 'assets/js/pending.js',
    'assets/js/reviews.js', 'assets/js/decision-changes.js', 'assets/js/scorer.js', 'assets/js/model.js',
    'assets/js/app.js'
  ]);
  const {window} = dom;
  const $ = id => window.document.getElementById(id);

  check($('status').textContent.includes('Data loaded'), `status line should report the payload loaded, got "${$('status').textContent}"`);

  const expectedRunRows = (payload.run_removed || []).length;
  const rows = $('rr-list').querySelectorAll('article.row-card').length;
  check(rows === expectedRunRows, `run-removed view rendered ${rows} rows, expected ${expectedRunRows}`);
  ok(`run-removed rows: ${rows}`);

  const seasonOptions = [...$('rr-season').options].map(option => option.value);
  for (const season of payload.seasons || []) {
    check(seasonOptions.includes(season), `season ${season} missing from the run-removed filter`);
  }

  if (expectedRunRows) {
    const firstBatter = (payload.run_removed[0].batter || '').split(' ').pop();
    $('rr-search').value = firstBatter;
    $('rr-search').dispatchEvent(new window.Event('input'));
    const filtered = $('rr-list').querySelectorAll('article.row-card').length;
    check(filtered >= 1, `search for "${firstBatter}" should keep at least one row, kept ${filtered}`);
    ok(`search filter works (${filtered} row for "${firstBatter}")`);
    $('rr-search').value = '';
    $('rr-search').dispatchEvent(new window.Event('input'));
  }

  check($('rr-summary').textContent.includes('row'), 'run-removed summary should state a row count');
  check(!$('rr-csv').disabled || expectedRunRows === 0, 'CSV button should be enabled when rows exist');

  // decisions
  const classified = (payload.decisions || []).filter(row => row.classified ||
    (row.before && row.after && row.before !== row.after));
  $('dc-rows').value = 'all';
  $('dc-rows').dispatchEvent(new window.Event('change'));
  const allRows = $('dc-list').querySelectorAll('article.row-card').length;
  check(allRows === (payload.decisions || []).length, `bulletin "all" mode rendered ${allRows} rows, expected ${payload.decisions.length}`);
  $('dc-rows').value = 'classified';
  $('dc-rows').dispatchEvent(new window.Event('change'));
  const classRows = $('dc-list').querySelectorAll('article.row-card').length;
  check(classRows === classified.length, `bulletin "classified" mode rendered ${classRows} rows, expected ${classified.length}`);
  ok(`bulletin rows: ${allRows} all / ${classRows} classified`);

  // reviews archive
  const reviewRows = $('rv-list').querySelectorAll('article.row-card').length;
  const manifestCount = (payload.reviewSeries || [])[0]?.count ?? (payload.reviews || []).length;
  check(reviewRows === manifestCount, `review archive rendered ${reviewRows} rows, expected ${manifestCount}`);
  if (reviewsSeries[0]) {
    check(reviewRows === reviewsSeries[0].reviews.length, 'review archive rows should match its committed file');
  }
  ok(`review archive rows for newest season: ${reviewRows}`);

  // model card
  check($('model-card').querySelectorAll('tr').length >= 2, 'model card should render its rows instead of an empty table');
  ok('model card renders');

  // tab switching keeps state
  window.document.getElementById('pending-tab').click();
  check(window.document.getElementById('view-pending').classList.contains('is-active'), 'pending tab should activate');
  check(window.document.getElementById('view-run-removed').classList.contains('is-active') === false, 'only one view should be active');
  ok('tab switching');
  dom.window.close();
}

console.log('reviews.html');
{
  const dom = await loadPage('reviews.html', ['assets/js/render.js', 'assets/js/api.js', 'assets/js/reviews-feed.js']);
  const {window} = dom;
  const $ = id => window.document.getElementById(id);
  await new Promise(resolve => setTimeout(resolve, 600));
  const stats = [...$('rf-stats').querySelectorAll('.stat-value')].map(node => node.textContent.trim());
  check(stats.length === 6, `live feed should render six counters, got ${stats.length}`);
  check(stats[0] === '1' && stats[1] === '1', `live feed counters should count one review and one overturn, got ${stats.join('/')}`);
  const rows = $('rf-list').querySelectorAll('article.row-card').length;
  check(rows === 2, `live feed should list both review records, got ${rows}`);
  $('rf-show').value = 'overturned';
  $('rf-show').dispatchEvent(new window.Event('change'));
  const overturned = $('rf-list').querySelectorAll('article.row-card').length;
  check(overturned === 2, `"overturned only" filter should show 2, got ${overturned}`);
  $('rf-show').value = 'pitch';
  $('rf-show').dispatchEvent(new window.Event('change'));
  const pitch = $('rf-list').querySelectorAll('article.row-card').length;
  check(pitch === 1, `"pitch challenges" filter should show 1, got ${pitch}`);
  ok(`live feed: ${stats.length} counters, ${rows} rows, filters work`);
  window.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed.');
