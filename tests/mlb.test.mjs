import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {easternDate, getPending, getReviews, playByPlay, readJSON, scanDate, scheduleFor} from '../assets/js/mlb.js';

const date = '2026-06-13';
const game = {gamePk: 42, officialDate: date, season: '2026', status: {abstractGameState: 'Live'}};
const mark = (eventType, description) => ({eventType, description});
const review = (reviewType, isOverturned = true, inProgress = false) => ({reviewType, isOverturned, inProgress});
const response = json => ({ok: true, json: async () => json});

test('schedule date is Eastern Time, not UTC', () => {
  assert.equal(easternDate(new Date('2026-06-14T01:00:00Z')), date);
});

test('pending codes match exactly, including runner and event markers, without duplicate rows', () => {
  const primary = mark('os_ruling_pending_primary', 'Official Scorer Ruling Pending');
  const prior = mark('os_ruling_pending_prior');
  const rows = getPending({game, plays: [{atBatIndex: 1, result: primary,
    playEvents: [{details: primary}, {details: mark('other', 'Official Scorer Ruling Pending')}],
    runners: [{details: prior}]}]});
  assert.deepEqual(rows.map(row => row.type), [primary.eventType, prior.eventType]);
  assert.equal(rows[1].description, undefined);
  assert.equal(rows[0].gamePk, 42);
});

test('includes only overturned, completed reviews and de-duplicates matching terminal events', () => {
  const rows = getReviews({game, plays: [{atBatIndex: 1, result: {description: 'Walk'}, reviewDetails: review('MJ'),
    playEvents: [{index: 0, reviewDetails: review('MA', false)}, {index: 1, reviewDetails: review('MF', true, true)},
      {index: 2, reviewDetails: review('MJ')}, {index: 3, reviewDetails: review('MJ')}]},
  {atBatIndex: 2, reviewDetails: review('NH')}, {atBatIndex: 3, reviewDetails: {isOverturned: true}}]});
  assert.deepEqual(rows.map(row => [row.atBatIndex, row.eventIndex, row.type, row.description]), [
    [1, 2, 'MJ', undefined], [1, 3, 'MJ', 'Walk'], [2, undefined, 'NH', undefined]
  ]);
});

test('scanner reports partial failures and handles an empty schedule', async () => {
  const final = {...game, gamePk: 43, status: {abstractGameState: 'Final'}};
  const preview = {...game, gamePk: 44, status: {abstractGameState: 'Preview'}};
  const request = async url => {
    if (url === scheduleFor(date)) return response({dates: [{games: [game, final, preview]}]});
    if (url === playByPlay(42)) return response({allPlays: []});
    if (url === playByPlay(43)) return {ok: false, status: 503};
    assert.fail(`Unexpected lookup: ${url}`);
  };
  assert.deepEqual(await scanDate(date, false, request), {feeds: [{game, plays: []}], failed: [43], scheduled: 2});
  assert.deepEqual(await scanDate(date, true, request), {feeds: [{game, plays: []}], failed: [], scheduled: 1});
  assert.deepEqual(await scanDate(date, true, async () => response({dates: []})), {feeds: [], failed: [], scheduled: 0});
  await assert.rejects(scanDate(date, false, async () => response({error: 'invalid'})), /format/);
  await assert.rejects(readJSON(scheduleFor(date), async () => ({ok: false, status: 503})), /503/);
});


test('review reason codes are decoded only through MLB registry suffixes', async () => {
  const {reasonCode, isPitchReview, reviewEvents, scanReviews, reviewReasonsUrl} = await import('../assets/js/mlb.js');
  const registry = {H: 'Home run', N: 'Fan interference', J: 'Pitch result', A: 'Tag play'};
  assert.equal(reasonCode('NH', registry), 'H');
  assert.equal(reasonCode('MJ', registry), 'J');
  assert.equal(reasonCode('QZ', registry), null);
  assert.equal(reasonCode(null, registry), null);
  assert.equal(isPitchReview('MJ', registry, null), true);
  assert.equal(isPitchReview('NH', registry, 0), true);
  assert.equal(isPitchReview('NH', registry, null), false);
});

test('reviewEvents keeps play-level and pitch-level records with official details', async () => {
  const {reviewEvents} = await import('../assets/js/mlb.js');
  const registry = {H: 'Home run', J: 'Pitch result'};
  const plays = [
    {atBatIndex: 1, about: {inning: 9, halfInning: 'bottom'}, matchup: {batter: {fullName: 'Juan Soto'}},
     result: {description: 'Umpire reviewed (home run), overturned', eventType: 'double'},
     runners: [{details: {isScoringEvent: false}}, {details: {isScoringEvent: true}}],
     reviewDetails: {reviewType: 'NH', isOverturned: true, inProgress: false}},
    {atBatIndex: 2, result: {description: 'Ball', eventType: 'single'}, runners: [],
     playEvents: [{index: 3, playId: 'guid-1', details: {description: 'Called Strike'},
                   reviewDetails: {reviewType: 'MJ', isOverturned: true, inProgress: false}}]}
  ];
  const rows = reviewEvents({game, plays}, registry);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => [row.atBatIndex, row.eventIndex, row.reviewType, row.overturned]),
    [[1, null, 'NH', true], [2, 3, 'MJ', true]]);
  assert.equal(rows[0].runsCredited, 1);
  assert.equal(rows[0].isPitch, false);
  assert.equal(rows[1].isPitch, true);
  assert.equal(rows[1].playId, 'guid-1');
  assert.equal(rows[1].description, 'Called Strike');
});

test('scanReviews reads the registry once and returns rows plus feed coverage', async () => {
  const {scanReviews} = await import('../assets/js/mlb.js');
  const request = async url => {
    if (url === 'https://statsapi.mlb.com/api/v1/reviewReasons') return response([{code: 'H', description: 'Home run'}]);
    if (url === scheduleFor(date)) return response({dates: [{games: [game]}]});
    if (url === playByPlay(42)) return response({allPlays: [{atBatIndex: 5, result: {description: 'review'},
      reviewDetails: {reviewType: 'NH', isOverturned: true, inProgress: false}}]});
    assert.fail(`Unexpected lookup: ${url}`);
  };
  const result = await scanReviews(date, request);
  assert.equal(result.scheduled, 1);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].reason, 'Home run');
  assert.equal(result.failed.length, 0);
});

test('official scorer keeps true zero RBI, never manufactures missing values or model scores', async () => {
  const {getScoredBalls} = await import('../assets/js/mlb.js');
  const p = {about: {isComplete:true, inning:4}, result: {event:'Double', rbi:0},
    playEvents: [{details:{isInPlay:true}}], matchup:{batter:{fullName:'Fixture batter'}}};
  const rows = getScoredBalls({game, plays:[p, {...p, result:{event:'Field Out'}},
    {...p, about:{isComplete:false}}, {...p, playEvents:[]}]});
  assert.equal(rows.length, 2);
  assert.equal(rows[0].rbi, 0);
  assert.equal(rows[1].rbi, undefined);
  assert.equal(rows[0].score, undefined);
  assert.equal(rows[0].pbp, playByPlay(game.gamePk));
});
