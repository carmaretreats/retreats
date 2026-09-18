import type { APIRoute } from 'astro';
import { z } from 'astro:schema';
import { subscribeNewsletter } from '../../lib/newsletter.js';

export const prerender = false;
const input = z.object({
  email: z.string().trim().max(254).email(),
  consent: z.literal('yes'),
});

export const POST: APIRoute = async ({ request, url }) => {
  const json = request.headers.get('accept')?.includes('application/json');
  const reply = (status: number, message: string) => json
    ? new Response(JSON.stringify({ message }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
    : new Response(null, { status: 303, headers: { Location: `/newsletter?status=${status === 200 ? 'success' : 'error'}`, 'Cache-Control': 'no-store' } });

  if (request.headers.get('origin') !== url.origin) return reply(403, 'Bitte melde dich direkt über unsere Webseite an.');
  if (Number(request.headers.get('content-length')) > 4096) return reply(413, 'Die Anfrage ist zu groß.');
  let form: FormData;
  try { form = await request.formData(); }
  catch { return reply(400, 'Bitte prüfe deine Eingaben.'); }
  const success = 'Danke! Du bist für unseren Newsletter eingetragen.';
  if (form.get('website')) return reply(200, success);
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return reply(400, 'Bitte gib eine gültige E-Mail-Adresse ein und bestätige deine Einwilligung.');
  try {
    await subscribeNewsletter({
      email: parsed.data.email,
      apiKey: process.env.BREVO_API_KEY || import.meta.env.BREVO_API_KEY,
      listId: process.env.BREVO_NEWSLETTER_LIST_ID || import.meta.env.BREVO_NEWSLETTER_LIST_ID,
      listName: process.env.BREVO_NEWSLETTER_LIST_NAME || import.meta.env.BREVO_NEWSLETTER_LIST_NAME || 'Carma retreat',
    });
    return reply(200, success);
  } catch {
    return reply(503, 'Die Anmeldung ist gerade nicht möglich. Bitte versuche es später erneut.');
  }
};
