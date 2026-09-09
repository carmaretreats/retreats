import data from '../content/retreats-page.json';

// Diese Fragen entscheiden ueber die Buchung und stehen deshalb bei den
// Preisen, nicht erst im FAQ am Seitenende. Der Rest bleibt unten.
const bookingQuestions = ['Was ist enthalten?', 'Wo finden die Retreats statt?'];

const all = [...(data.faqSection.faqsLeft || []), ...(data.faqSection.faqsRight || [])];

export const bookingFaqs = bookingQuestions
  .map((q) => all.find((f) => f.question === q))
  .filter(Boolean);

export const generalFaqs = all.filter((f) => !bookingQuestions.includes(f.question));
