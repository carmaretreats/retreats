import { createSign } from 'node:crypto';
import { parseRows, findRow } from './verfuegbarkeit.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
const LOG = 'Buchungen';
const LOG_HEADER = ['Datum', 'Retreat', 'Zimmer', 'Name', 'E-Mail', 'Betrag', 'Stripe-ID'];

const b64url = (s) => Buffer.from(s).toString('base64url');

async function accessToken(email, key, request) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: email, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 600 };
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}`;
  // Netlify speichert den PEM-Schlüssel einzeilig mit \n
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.replace(/\\n/g, '\n'), 'base64url');
  const response = await request('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Google token ${response.status}: ${await response.text()}`);
  return (await response.json()).access_token;
}

export const sheetIdFromUrl = (url) => String(url ?? '').match(/spreadsheets\/d\/([\w-]+)/)?.[1] ?? '';

// Zählt "Frei" für das bezahlte Zimmer herunter und protokolliert die Buchung im Tab "Buchungen".
// Die Stripe-ID im Protokoll verhindert doppeltes Austragen, wenn Stripe ein Event erneut zustellt.
// Gibt die neue Zahl freier Plätze zurück, null wenn das Zimmer nicht im Sheet steht, 'duplicate' bei Wiederholung.
export async function recordBooking({ sheetId, email: saEmail, key }, booking, request = fetch) {
  if (!sheetId || !saEmail || !key) throw new Error('Sheet configuration missing');
  const token = await accessToken(saEmail, key, request);
  const call = async (path, init = {}) => {
    const response = await request(`${API}/${sheetId}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Sheets ${path.split('?')[0]} ${response.status}: ${await response.text()}`);
    return response.json();
  };
  const range = (tab, cells) => encodeURIComponent(`'${tab.replace(/'/g, "''")}'!${cells}`);

  const meta = await call('?fields=sheets.properties.title');
  const titles = meta.sheets.map((s) => s.properties.title);
  const main = titles[0];
  if (!titles.includes(LOG)) {
    await call(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: LOG } } }] }) });
    await call(`/values/${range(LOG, 'A1')}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: [LOG_HEADER] }) });
  } else {
    const logged = await call(`/values/${range(LOG, 'G:G')}`);
    if ((logged.values ?? []).some(([id]) => id === booking.sessionId)) return 'duplicate';
  }

  let free = null;
  const hit = booking.retreat && booking.room
    ? findRow(parseRows((await call(`/values/${range(main, 'A:Z')}`)).values ?? []), booking.retreat, booking.room)
    : null;
  if (hit) {
    free = Math.max(0, hit.free - 1);
    const column = String.fromCharCode(65 + hit.freeCol);
    await call(`/values/${range(main, `${column}${hit.sheetRow}`)}?valueInputOption=RAW`, { method: 'PUT', body: JSON.stringify({ values: [[free]] }) });
  }

  const date = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  await call(`/values/${range(LOG, 'A:G')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [[date, booking.retreat || booking.reference, booking.room, booking.name, booking.email, `${(booking.amount / 100).toFixed(2).replace('.', ',')} €`, booking.sessionId]] }),
  });
  return free;
}
