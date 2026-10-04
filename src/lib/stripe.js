import { createHmac, timingSafeEqual } from 'node:crypto';

// Prüft den Stripe-Signature-Header wie das offizielle SDK (v1-Schema, 5 Minuten Toleranz),
// ohne dafür das ganze SDK samt Secret Key einzubinden
export function verifyStripeSignature(payload, header, secret, now = Date.now() / 1000, tolerance = 300) {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  if (!t || Math.abs(now - t) > tolerance) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex'));
  return parts.some(([k, v]) => k === 'v1' && v?.length === expected.length && timingSafeEqual(Buffer.from(v), expected));
}
