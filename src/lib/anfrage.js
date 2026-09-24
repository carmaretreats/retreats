const RESEND = 'https://api.resend.com/emails';
const FROM = 'CARMA Retreats <retreats@carma-retreats.com>';
const TEAM = 'kontakt@carma-retreats.com';

const SITE = 'https://www.carma-retreats.com';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Inline-Styles, weil Mailclients keine Stylesheets laden. Farben aus brand.css:
// Creme #fff8ee, Terra #9a4736, Orange #e05830, Ink #352a1f.
const T = {
  body: 'margin:0;padding:0;background:#ffffff;',
  outer: 'width:100%;background:#ffffff;padding:32px 16px;',
  card: 'max-width:560px;margin:0 auto;background:#fff8ee;',
  inner: 'padding:36px 40px 32px;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;color:#352a1f;font-size:16px;line-height:1.55;',
  label: 'font-family:Helvetica Neue,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#9a4736;margin:0 0 18px;',
  h1: 'font-family:Georgia,Times New Roman,serif;font-style:italic;font-weight:400;font-size:28px;line-height:1.2;color:#352a1f;margin:0 0 22px;',
  p: 'margin:0 0 16px;',
  th: 'padding:8px 18px 8px 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9a4736;vertical-align:top;white-space:nowrap;',
  td: 'padding:8px 0;border-bottom:1px solid rgba(154,71,54,0.18);vertical-align:top;',
  note: 'margin:24px 0 0;padding:16px 18px;background:#ffffff;font-size:14px;line-height:1.5;',
  link: 'color:#9a4736;text-decoration:underline;',
  foot: 'padding:20px 40px 0;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#352a1f;opacity:0.7;text-align:center;',
  btn: 'display:inline-block;padding:12px 24px;background:#9a4736;color:#fff8ee;text-decoration:none;border-radius:999px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;',
};

const table = (pairs) => `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;width:100%">${pairs
  .filter(([, v]) => v)
  .map(([k, v]) => `<tr><td style="${T.th}">${k}</td><td style="${T.td}">${esc(v)}</td></tr>`)
  .join('')}</table>`;

const STRIPE = 'https://buy.stripe.com/bJe28saY90bDa8Y3Lv3sI00';
// Retreat, Zimmer und Name als Referenz an der Stripe-Zahlung, damit die Kundin
// im Stripe-Dashboard sieht, welches Zimmer bezahlt wurde
const payLink = ({ retreat, room, name, email }) => {
  const ref = [retreat, room, name].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 200);
  return `${STRIPE}?client_reference_id=${encodeURIComponent(ref)}&prefilled_email=${encodeURIComponent(email)}`;
};

const layout = ({ label, headline, body, cta, secondary }) => `<!doctype html><html lang="de"><body style="${T.body}">
<div style="${T.outer}">
  <div style="${T.card}"><div style="${T.inner}">
    <p style="${T.label}">${label}</p>
    <h1 style="${T.h1}">${headline}</h1>
    ${body}
    ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0"><tr><td style="padding:0 20px 0 0"><a href="${cta.href}" style="${T.btn}">${cta.text}</a></td>${secondary ? `<td style="font-size:14px;white-space:nowrap"><a href="${secondary.href}" style="${T.link}">${secondary.text}</a></td>` : ''}</tr></table>` : ''}
  </div></div>
  <p style="${T.foot}">CARMA Retreats · Yoga-Retreats in Hikkaduwa, Sri Lanka<br><a href="${SITE}" style="color:#9a4736;text-decoration:none">carma-retreats.com</a> · <a href="mailto:${TEAM}" style="color:#9a4736;text-decoration:none">${TEAM}</a></p>
</div>
</body></html>`;

const toText = (html) => html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/<\/(p|h1|tr|div)>/g, '\n')
  .replace(/<\/td>/g, '  ')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

export function buildMails({ kind, name, email, phone, retreat, room, message }) {
  const isBooking = kind === 'booking';
  const who = name || email;
  const details = table([['Name', name], ['E-Mail', email], ['Telefon / WhatsApp', phone], ['Retreat', retreat], ['Zimmer', room], [isBooking ? 'Nachricht' : 'Frage', message]]);

  const leadHtml = layout({
    label: isBooking ? 'Buchungsanfrage' : 'Frage über die Website',
    headline: isBooking ? `Neue Anfrage von <em>${esc(who)}</em>` : `Neue Frage von <em>${esc(who)}</em>`,
    body: `<p style="${T.p}">Gerade über die Website eingegangen. Antworten geht direkt über Antworten, die Adresse ist als Reply-To gesetzt.</p>${details}`,
  });
  const lead = {
    to: TEAM,
    reply_to: email,
    subject: isBooking ? `Buchungsanfrage von ${who}: ${retreat}` : `Frage über die Website von ${who}`,
    html: leadHtml,
    text: toText(leadHtml),
  };

  const greeting = name ? `Hallo ${esc(name)},` : 'Hallo,';
  const confirmHtml = isBooking
    ? layout({
        label: 'Deine Auszeit rückt näher',
        headline: 'Danke für deine Anfrage, <em>wir freuen uns.</em>',
        body: `<p style="${T.p}">${greeting}</p>
<p style="${T.p}">wie schön, dass du dir eine Auszeit mit uns in Sri Lanka gönnen möchtest. Deine Anfrage ist bei uns angekommen, wir melden uns gern und meist noch am selben Tag bei dir.</p>
${table([['Retreat', retreat], ['Zimmer', room && room !== 'Noch unsicher' ? room : 'Noch offen, wir beraten dich'], ['Nachricht', message]])}
<p style="${T.note}">Dein Platz ist damit noch nicht reserviert, verbindlich wird er mit der Anzahlung. Wenn du dir schon sicher bist, kannst du sie gleich hier leisten. Sonst warte einfach entspannt auf unsere Antwort.</p>
<p style="${T.note}">Mit der Anzahlung akzeptierst du unsere <a href="${SITE}/uploads/carma-agb.pdf" style="color:#9a4736">AGB</a>.</p>
<p style="margin:24px 0 0">Bis bald,<br>Carmen &amp; Mareen</p>`,
        cta: { href: payLink({ retreat, room, name, email }), text: 'Anzahlen und Platz sichern' },
        secondary: { href: `${SITE}/uploads/carma-info-guide-2027.pdf`, text: 'Info-Guide als PDF' },
      })
    : layout({
        label: 'Wir sind für dich da',
        headline: 'Danke für deine Frage, <em>wir freuen uns.</em>',
        body: `<p style="${T.p}">${greeting}</p>
<p style="${T.p}">wie schön, dass du dich meldest. Deine Frage ist bei uns angekommen, wir antworten dir gern und meist noch am selben Tag.</p>
${table([['Deine Frage', message]])}
<p style="margin:24px 0 0">Bis bald,<br>Carmen &amp; Mareen</p>`,
      });
  const confirm = {
    to: email,
    reply_to: TEAM,
    subject: isBooking ? 'Schön, dass du da bist – deine Anfrage bei CARMA Retreats' : 'Schön, dass du dich meldest – deine Frage an CARMA Retreats',
    html: confirmHtml,
    text: toText(confirmHtml),
  };
  return { lead, confirm };
}

export async function sendAnfrage(input, apiKey, request = fetch) {
  if (!apiKey) throw new Error('Mail configuration missing');
  const { lead, confirm } = buildMails(input);
  for (const mail of [lead, confirm]) {
    const response = await request(RESEND, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: FROM, ...mail }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Resend ${mail === lead ? 'lead' : 'confirm'} failed (${response.status}): ${await response.text()}`);
  }
}
