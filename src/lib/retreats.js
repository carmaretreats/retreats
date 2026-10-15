import retreats from '../content/seite/retreats.json' with { type: 'json' };
import unterkunft from '../content/seite/unterkunft.json' with { type: 'json' };

// Datum und Zimmername kommen aus dem CMS. Sie stecken in der Stripe-Referenz
// und müssen zum Zimmer-Sheet passen.
export const RETREATS = retreats.retreats.map((r) => r.datum);
export const ROOMS = [...unterkunft.zimmer.map((z) => z.name), 'Noch unsicher'];

// Stripe erlaubt in client_reference_id nur Buchstaben, Ziffern, - und _ (max. 200 Zeichen)
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const bookingRef = ({ retreat, room, name }) => slug([retreat, room, name].join(' ')).slice(0, 200);

// Gegenstück zu bookingRef, damit der Webhook Retreat und Zimmer zurückbekommt
export function parseBookingRef(ref) {
  let rest = String(ref ?? '');
  const take = (list) => {
    const hit = list.find((v) => rest === slug(v) || rest.startsWith(`${slug(v)}-`));
    if (hit) rest = rest.slice(slug(hit).length + 1);
    return hit ?? '';
  };
  const retreat = take(RETREATS);
  const room = retreat ? take(ROOMS) : '';
  return { retreat, room, name: retreat && room ? rest.replace(/-/g, ' ') : '' };
}
