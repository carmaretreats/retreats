// Alle Texte und Bilder der Seite liegen in src/content/seite und werden im CMS (/admin) gepflegt.
import kopfbereich from '../content/seite/kopfbereich.json';
import stellDirVor from '../content/seite/stell-dir-vor.json';
import retreats from '../content/seite/retreats.json';
import highlights from '../content/seite/highlights.json';
import retreatInfos from '../content/seite/retreat-infos.json';
import tagesablauf from '../content/seite/tagesablauf.json';
import unterkunft from '../content/seite/unterkunft.json';
import ueberUns from '../content/seite/ueber-uns.json';
import stimmen from '../content/seite/stimmen.json';
import galerie from '../content/seite/galerie.json';
import buchung from '../content/seite/buchung.json';
import slogan from '../content/seite/slogan.json';
import faq from '../content/seite/faq.json';
import allgemein from '../content/seite/allgemein.json';

export { kopfbereich, stellDirVor, retreats, highlights, retreatInfos, tagesablauf, unterkunft, ueberUns, stimmen, galerie, buchung, slogan, faq, allgemein };

const escape = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Im CMS markiert *so* kursive und **so** fette Stellen, ohne dass die Kundin HTML schreiben muss
export const format = (s) => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

// Das CMS-Textfeld trennt Absätze mit Zeilenumbrüchen
export const absaetze = (s) => String(s ?? '').split(/\n+/).map((t) => t.trim()).filter(Boolean);

export const euro = (n) => `${n} Euro`;

// Ort ohne Land, für die Terminzeilen ("in Hikkaduwa")
export const ortKurz = (r) => r.ort.split(',')[0].trim();

export const gesamtpreis = (zimmer) => zimmer.preis + unterkunft.retreatgebuehr;

export const pos = (bild) => (bild?.ausschnitt ? `object-position:${bild.ausschnitt}` : undefined);

// wa.me erwartet die Nummer ohne Plus und ohne Leerzeichen
export const waLink = (text) => `https://wa.me/${allgemein.whatsapp.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
