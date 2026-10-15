import { faq } from './inhalt.js';

// Fragen mit "Bei Unterkunft & Preise zeigen" entscheiden über die Buchung und
// stehen deshalb bei den Preisen, nicht erst im FAQ am Seitenende.
export const bookingFaqs = faq.fragen.filter((f) => f.beiPreisen);
