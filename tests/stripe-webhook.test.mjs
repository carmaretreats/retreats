import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature } from '../src/lib/stripe.js';
import { bookingRef, parseBookingRef } from '../src/lib/retreats.js';
import { buildPaymentMails } from '../src/lib/anfrage.js';

const secret = 'whsec_test_only';
const sign = (payload, t) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;

test('accepts a correctly signed payload and rejects tampering, wrong secret and old timestamps', () => {
  const now = 1_800_000_000;
  const payload = '{"id":"evt_1"}';
  assert.equal(verifyStripeSignature(payload, sign(payload, now), secret, now), true);
  assert.equal(verifyStripeSignature(payload + ' ', sign(payload, now), secret, now), false);
  assert.equal(verifyStripeSignature(payload, sign(payload, now), 'whsec_other', now), false);
  assert.equal(verifyStripeSignature(payload, sign(payload, now - 600), secret, now), false);
  assert.equal(verifyStripeSignature(payload, null, secret, now), false);
});

test('booking reference round-trips retreat and room', () => {
  const ref = bookingRef({ retreat: '13.–19. Februar 2027', room: 'Einzelzimmer Deluxe (1. OG)', name: 'Jörg Müller' });
  assert.equal(ref, '13-19-Februar-2027-Einzelzimmer-Deluxe-1-OG-Jorg-Muller');
  assert.deepEqual(parseBookingRef(ref), { retreat: '13.–19. Februar 2027', room: 'Einzelzimmer Deluxe (1. OG)', name: 'Jorg Muller' });
  assert.deepEqual(parseBookingRef('23-29-Januar-2027-Noch-unsicher-Anna'), { retreat: '23.–29. Januar 2027', room: 'Noch unsicher', name: 'Anna' });
  assert.deepEqual(parseBookingRef(null), { retreat: '', room: '', name: '' });
  assert.deepEqual(parseBookingRef('irgendwas'), { retreat: '', room: '', name: '' });
});

test('paid sends team and guest mail, failed only the team', () => {
  const base = { retreat: '23.–29. Januar 2027', room: 'Stockbett im Dreibettzimmer', name: 'Anna', email: 'anna@example.invalid', amount: 30000, currency: 'eur', reference: 'x', sessionId: 'cs_1' };
  const paid = buildPaymentMails({ ...base, status: 'paid' });
  assert.equal(paid.length, 2);
  assert.equal(paid[0].to, 'kontakt@carma-retreats.com');
  assert.match(paid[0].subject, /Anzahlung eingegangen: Anna, 23\.–29\. Januar 2027, Stockbett/);
  assert.match(paid[0].text, /300,00\s€/);
  assert.equal(paid[1].to, base.email);
  const failed = buildPaymentMails({ ...base, status: 'failed' });
  assert.equal(failed.length, 1);
  assert.match(failed[0].subject, /fehlgeschlagen/);
});
