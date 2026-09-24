import type { APIRoute } from 'astro';
import { loadAvailability } from '../../lib/verfuegbarkeit.js';

export const prerender = false;

// Zeigt, was die Website gerade aus dem Sheet der Kundin liest (nur Zimmer und Zahlen).
export const GET: APIRoute = async () => {
  const url = process.env.AVAILABILITY_SHEET_URL || import.meta.env.AVAILABILITY_SHEET_URL || '';
  let error = '';
  let status: number | null = null;
  let sample = '';
  if (url) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      status = response.status;
      sample = (await response.text()).slice(0, 200);
    } catch (err) {
      error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }
  }
  const rows = await loadAvailability(url);
  return new Response(JSON.stringify({ configured: Boolean(url), status, error, sample, rows }, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
