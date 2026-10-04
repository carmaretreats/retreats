import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { recordBooking, sheetIdFromUrl } from '../src/lib/sheet.js';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const config = { sheetId: 'sheet1', email: 'sa@test.invalid', key: privateKey.export({ type: 'pkcs8', format: 'pem' }).replace(/\n/g, '\\n') };
const booking = { retreat: '13.–19. Februar 2027', room: 'Einzelzimmer Deluxe (1. OG)', name: 'Anna', email: 'anna@example.invalid', amount: 30000, reference: 'ref', sessionId: 'cs_1' };
const grid = [['Retreat', 'Zimmer', 'Frei'], ['Januar', 'Einzelzimmer Deluxe (1. OG)', '0'], [], ['Februar', 'Einzelzimmer Deluxe (1. OG)', '2']];

const fakeGoogle = ({ tabs = ['Tabellenblatt1'], logged = [] } = {}) => {
  const calls = [];
  const request = async (url, init = {}) => {
    const u = decodeURIComponent(url);
    calls.push({ url: u, method: init.method ?? 'GET', body: init.body && typeof init.body === 'string' ? JSON.parse(init.body) : null });
    if (u.startsWith('https://oauth2')) return Response.json({ access_token: 'tok' });
    if (u.includes('fields=sheets')) return Response.json({ sheets: tabs.map((title) => ({ properties: { title } })) });
    if (u.includes("'Buchungen'!G:G")) return Response.json({ values: logged });
    if (u.includes("'Tabellenblatt1'!A:Z")) return Response.json({ values: grid });
    return Response.json({});
  };
  return { calls, request };
};

test('reads the sheet id from the CSV export url', () => {
  assert.equal(sheetIdFromUrl('https://docs.google.com/spreadsheets/d/1tAet4-x_Y/export?format=csv&gid=0'), '1tAet4-x_Y');
});

test('creates the log tab, decrements the matching row and logs the booking', async () => {
  const { calls, request } = fakeGoogle();
  assert.equal(await recordBooking(config, booking, request), 1);
  assert.ok(calls.some((c) => c.body?.requests?.[0]?.addSheet?.properties?.title === 'Buchungen'));
  const update = calls.find((c) => c.method === 'PUT' && c.url.includes("'Tabellenblatt1'!"));
  assert.match(update.url, /'Tabellenblatt1'!C4\?/);
  assert.deepEqual(update.body.values, [[1]]);
  const append = calls.find((c) => c.url.includes(':append'));
  assert.deepEqual(append.body.values[0].slice(1), ['13.–19. Februar 2027', 'Einzelzimmer Deluxe (1. OG)', 'Anna', 'anna@example.invalid', '300,00 €', 'cs_1']);
});

test('skips everything when Stripe redelivers a logged session', async () => {
  const { calls, request } = fakeGoogle({ tabs: ['Tabellenblatt1', 'Buchungen'], logged: [['Stripe-ID'], ['cs_1']] });
  assert.equal(await recordBooking(config, booking, request), 'duplicate');
  assert.ok(!calls.some((c) => c.method !== 'GET' && !c.url.startsWith('https://oauth2')));
});

test('logs bookings without a known room but leaves availability alone', async () => {
  const { calls, request } = fakeGoogle({ tabs: ['Tabellenblatt1', 'Buchungen'] });
  assert.equal(await recordBooking(config, { ...booking, room: 'Noch unsicher' }, request), null);
  assert.ok(!calls.some((c) => c.method === 'PUT'));
  assert.ok(calls.some((c) => c.url.includes(':append')));
});

test('refuses to run without configuration', async () => {
  await assert.rejects(recordBooking({ ...config, key: '' }, booking, async () => { throw new Error('no call expected'); }), /configuration/);
});
