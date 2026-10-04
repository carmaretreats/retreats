// Zimmerverfügbarkeit kommt aus einem Google Sheet der Kundin, das als CSV
// freigegeben ist. Spalten: Retreat | Zimmer | Frei. Fehlt das Sheet oder eine
// Zeile, gilt das Zimmer als frei, damit die Seite nie durch das Sheet ausfällt.
const CACHE_MS = 5 * 60 * 1000;
let cache = { url: '', at: 0, rows: null };

// Vergleich unabhängig von Groß-/Kleinschreibung, Leerzeichen und Gedankenstrichen,
// damit "Januar 2027" im Sheet zu "23.–29. Januar 2027" auf der Seite passt.
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

const splitLine = (line) => {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted && c === '"' && line[i + 1] === '"') { cell += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { cells.push(cell); cell = ''; }
    else cell += c;
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
};

export function parseAvailability(csv) {
  return parseRows(String(csv).replace(/^\uFEFF/, '').split(/\r?\n/).map(splitLine));
}

// Zeilen als Zellen-Arrays (CSV-Export oder Sheets-API); sheetRow ist die Zeilennummer im Sheet
export function parseRows(cellRows) {
  if (!cellRows.length) return [];
  const header = cellRows[0].map(norm);
  const col = (names) => header.findIndex((h) => names.includes(h));
  const iRetreat = col(['retreat', 'termin', 'datum']);
  const iRoom = col(['zimmer', 'room', 'kategorie']);
  const iFree = col(['frei', 'freieplätze', 'plätze', 'verfügbar', 'free']);
  if (iRetreat < 0 || iRoom < 0 || iFree < 0) return [];
  return cellRows.slice(1).flatMap((cells, i) => {
    const free = Number.parseInt(cells[iFree], 10);
    if (!cells[iRoom] || Number.isNaN(free)) return [];
    return [{ retreat: String(cells[iRetreat] ?? '').trim(), room: String(cells[iRoom]).trim(), free: Math.max(0, free), sheetRow: i + 2, freeCol: iFree }];
  });
}

export function findRow(rows, retreat, room) {
  if (!rows) return null;
  const r = norm(retreat);
  const z = norm(room);
  return rows.find((row) => {
    const rr = norm(row.retreat);
    return norm(row.room) === z && (!rr || r.includes(rr) || rr.includes(r));
  }) ?? null;
}

export function freeSlots(rows, retreat, room) {
  if (!rows) return null;
  return findRow(rows, retreat, room)?.free ?? null;
}

export async function loadAvailability(url, request = fetch) {
  if (!url) return null;
  if (cache.url === url && Date.now() - cache.at < CACHE_MS) return cache.rows;
  try {
    const response = await request(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Sheet ${response.status}`);
    const rows = parseAvailability(await response.text());
    cache = { url, at: Date.now(), rows };
    return rows;
  } catch (err) {
    console.error('[verfuegbarkeit]', err);
    return cache.url === url ? cache.rows : null;
  }
}
