export const RETREATS = ['23.–29. Januar 2027', '13.–19. Februar 2027'];
export const ROOMS = ['Stockbett im Dreibettzimmer', 'Doppelbett im Dreibettzimmer', 'Einzelzimmer Standard (EG)', 'Einzelzimmer Deluxe (1. OG)', 'Einzelzimmer Premium (1. OG)', 'Noch unsicher'];

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
