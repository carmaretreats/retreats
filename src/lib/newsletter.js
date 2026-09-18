const API = 'https://api.brevo.com/v3';

export async function subscribeNewsletter({ email, apiKey, listName = 'Carma retreat', listId }, request = fetch) {
  if (!apiKey) throw new Error('Newsletter configuration missing');
  const headers = { 'api-key': apiKey, accept: 'application/json' };
  let target = Number(listId);
  if (!Number.isSafeInteger(target) || target <= 0) {
    const matches = [];
    const normalize = (name) => name.trim().toLocaleLowerCase('de-DE');
    for (let offset = 0; ; offset += 50) {
      const response = await request(`${API}/contacts/lists?limit=50&offset=${offset}`, {
        headers, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Brevo list lookup failed (${response.status})`);
      const data = await response.json();
      matches.push(...data.lists.filter(list => normalize(list.name) === normalize(listName)));
      if (data.lists.length < 50 || offset + 50 >= data.count) break;
      if (offset >= 4950) throw new Error('Brevo list lookup limit reached');
    }
    if (matches.length !== 1) throw new Error('Newsletter list must match exactly once');
    target = matches[0].id;
  }
  const response = await request(`${API}/contacts`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ email, listIds: [target], updateEnabled: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Brevo contact request failed (${response.status})`);
}
