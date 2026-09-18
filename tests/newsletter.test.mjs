import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeNewsletter } from '../src/lib/newsletter.js';
const options = { email: 'newsletter-test@example.invalid', apiKey: 'test-only-key' };

test('finds the named list across pages and subscribes only to that list', async () => {
  const calls = [];
  await subscribeNewsletter(options, async (url, init) => {
    calls.push({ url, init });
    if (calls.length === 1) return Response.json({ count: 51, lists: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Other ${i}` })) });
    if (calls.length === 2) return Response.json({ count: 51, lists: [{ id: 93, name: 'Carma Retreat' }] });
    return new Response(null, { status: 201 });
  });
  assert.match(calls[1].url, /offset=50/);
  assert.deepEqual(JSON.parse(calls[2].init.body), { email: options.email, listIds: [93], updateEnabled: true });
});

test('does not write contacts if Brevo rejects list access', async () => {
  let calls = 0;
  await assert.rejects(subscribeNewsletter(options, async () => { calls++; return new Response(null, { status: 401 }); }));
  assert.equal(calls, 1);
});

test('requires an unambiguous list match', async () => {
  for (const lists of [[], [{ id: 1, name: 'Carma retreat' }, { id: 2, name: 'Carma retreat' }]]) {
    let calls = 0;
    await assert.rejects(subscribeNewsletter(options, async () => { calls++; return Response.json({ count: lists.length, lists }); }));
    assert.equal(calls, 1);
  }
});

test('uses a verified list ID and accepts updates to existing contacts', async () => {
  await subscribeNewsletter({ ...options, listId: '93' }, async (url, init) => {
    assert.equal(url, 'https://api.brevo.com/v3/contacts');
    assert.deepEqual(JSON.parse(init.body).listIds, [93]);
    assert.equal(JSON.parse(init.body).emailBlacklisted, undefined);
    return new Response(null, { status: 204 });
  });
});

test('does not report success when contact creation fails', async () => {
  await assert.rejects(subscribeNewsletter({ ...options, listId: '93' }, async () => new Response(null, { status: 429 })));
});
