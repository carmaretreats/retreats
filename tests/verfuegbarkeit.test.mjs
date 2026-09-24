import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAvailability, freeSlots, loadAvailability } from '../src/lib/verfuegbarkeit.js';

const csv = `Retreat,Zimmer,Frei
Januar 2027,Stockbett im Dreibettzimmer,2
Januar 2027,"Einzelzimmer Deluxe (1. OG)",0
Februar 2027,Einzelzimmer Deluxe (1. OG),1
,Einzelzimmer Premium (1. OG),0
Januar 2027,Doppelbett im Dreibettzimmer,abc
`;

test('parses rows and ignores unusable counts', () => {
  const rows = parseAvailability(csv);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], { retreat: 'Januar 2027', room: 'Stockbett im Dreibettzimmer', free: 2 });
});

test('matches the sheet retreat against the page retreat and room names loosely', () => {
  const rows = parseAvailability(csv);
  assert.equal(freeSlots(rows, '23.–29. Januar 2027', 'Einzelzimmer Deluxe (1. OG)'), 0);
  assert.equal(freeSlots(rows, '13.–19. Februar 2027', 'einzelzimmer deluxe (1.OG)'), 1);
  assert.equal(freeSlots(rows, '23.–29. Januar 2027', 'Stockbett im Dreibettzimmer'), 2);
});

test('a row without retreat applies to every retreat, unknown rooms count as free', () => {
  const rows = parseAvailability(csv);
  assert.equal(freeSlots(rows, '13.–19. Februar 2027', 'Einzelzimmer Premium (1. OG)'), 0);
  assert.equal(freeSlots(rows, '13.–19. Februar 2027', 'Einzelzimmer Standard (EG)'), null);
  assert.equal(freeSlots(null, 'x', 'y'), null);
});

test('returns null without a url or when the sheet cannot be read', async () => {
  assert.equal(await loadAvailability(''), null);
  assert.equal(await loadAvailability('https://sheet.invalid/a', async () => new Response('nope', { status: 500 })), null);
});

test('reads the sheet once and serves the cache afterwards', async () => {
  let calls = 0;
  const request = async () => { calls++; return new Response(csv); };
  const first = await loadAvailability('https://sheet.invalid/b', request);
  const second = await loadAvailability('https://sheet.invalid/b', request);
  assert.equal(calls, 1);
  assert.equal(first.length, 4);
  assert.equal(second, first);
});
