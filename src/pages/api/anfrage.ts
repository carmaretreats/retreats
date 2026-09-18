import type { APIRoute } from 'astro';
import { z } from 'astro:schema';
import { sendAnfrage } from '../../lib/anfrage.js';

export const prerender = false;
const input = z.object({
  kind: z.enum(['booking', 'question']),
  name: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().max(254).email(),
  retreat: z.string().trim().max(120).optional().default(''),
  room: z.string().trim().max(120).optional().default(''),
  message: z.string().trim().max(4000).optional().default(''),
});

export const POST: APIRoute = async ({ request, url }) => {
  const reply = (status: number, message: string) =>
    new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (request.headers.get('origin') !== url.origin) return reply(403, 'Bitte sende die Anfrage direkt über unsere Webseite.');
  if (Number(request.headers.get('content-length')) > 16384) return reply(413, 'Die Anfrage ist zu groß.');
  let form: FormData;
  try { form = await request.formData(); }
  catch { return reply(400, 'Bitte prüfe deine Eingaben.'); }
  if (form.get('website')) return reply(200, 'Danke.');
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return reply(400, 'Bitte gib eine gültige E-Mail-Adresse ein.');
  if (parsed.data.kind === 'question' && !parsed.data.message) return reply(400, 'Bitte schreib uns deine Frage.');
  try {
    await sendAnfrage(parsed.data, process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY);
    return reply(200, 'Danke, deine Nachricht ist angekommen.');
  } catch (err) {
    console.error('[anfrage]', err);
    return reply(503, 'Das Senden hat gerade nicht geklappt. Schreib uns gern direkt per WhatsApp oder versuch es gleich noch einmal.');
  }
};
