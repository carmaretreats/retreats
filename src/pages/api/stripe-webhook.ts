import type { APIRoute } from 'astro';
import { verifyStripeSignature } from '../../lib/stripe.js';
import { parseBookingRef } from '../../lib/retreats.js';
import { sendPaymentMails } from '../../lib/anfrage.js';

export const prerender = false;

const env = (key: string) => process.env[key] || import.meta.env[key];

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), env('STRIPE_WEBHOOK_SECRET'))) {
    return new Response('Invalid signature', { status: 400 });
  }
  const event = JSON.parse(payload);
  const session = event.data?.object ?? {};
  // Bei Lastschrift o. ä. kommt "completed" noch unbezahlt, das Geld erst mit async_payment_succeeded
  const status =
    (event.type === 'checkout.session.completed' && session.payment_status === 'paid') || event.type === 'checkout.session.async_payment_succeeded' ? 'paid'
    : event.type === 'checkout.session.async_payment_failed' ? 'failed'
    : null;
  if (!status) return new Response('Ignored', { status: 200 });

  const booking = parseBookingRef(session.client_reference_id);
  const customer = session.customer_details ?? {};
  try {
    await sendPaymentMails({
      status,
      ...booking,
      // Der Name aus der Referenz hat keine Umlaute mehr, der von Stripe schon
      name: customer.name || booking.name,
      email: customer.email || session.customer_email || '',
      phone: customer.phone || '',
      amount: session.amount_total ?? 0,
      currency: session.currency || 'eur',
      reference: session.client_reference_id || '',
      sessionId: session.id,
    }, env('RESEND_API_KEY'));
  } catch (err) {
    // 500 lässt Stripe das Event später erneut zustellen
    console.error('[stripe-webhook]', event.id, err);
    return new Response('Mail failed', { status: 500 });
  }
  return new Response('OK', { status: 200 });
};
