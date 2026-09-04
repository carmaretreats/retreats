# Carma Retreats Preview Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static preview site with an index page and three layout variants (A polished plus mobile, B and C rough) that the client can open in a browser.

**Architecture:** Plain HTML and CSS in `preview/`, no build step. One shared stylesheet holds tokens, type scale and section primitives. Each variant is one HTML file. Deployed as a separate Vercel project so the live Astro site on Netlify is untouched.

**Tech Stack:** HTML, CSS, a small vanilla JS file for scroll reveal and accordion. Fonts: PP Editorial Old Italic (local file, client licence), Plus Jakarta Sans and Sora from Google Fonts. Deploy with Vercel CLI.

**Spec:** Paper file "Scratchpad", page "Carma Retreats Redesign", boards R2-A, R2-B, R2-C, R2-M1.

## Global Constraints

- Colours: creme `#FFF8EE`, terracotta `#9A4736`, orange accent `#E05830`, text `#352A1F`. No brown surfaces.
- Type: headline 64px Plus Jakarta Sans 300 (mobile 40px), body 18px Plus Jakarta Sans, label 12px Sora caps 0.18em. PP Editorial Old Italic only for one highlighted word per headline.
- No play buttons, video autoplays muted. No italic numbers.
- Wording verbatim from `src/content/retreats-page.json`.
- Images from `referenzen/bildmaterial` and `public/uploads`, copied into `preview/img`.
- `referenzen/` is gitignored, `preview/` is committed.

---

### Task 1: Scaffold, assets, shared CSS and JS

**Files:**
- Create: `preview/css/base.css`, `preview/js/main.js`, `preview/fonts/PPEditorialOld-Italic.otf`, `preview/img/*`

- [ ] Copy fonts and images with a bash script.
- [ ] Write `base.css` with tokens, type classes `.h1 .body .label .link`, layout helpers `.section .split .fullbleed .container`, header, footer, reveal animation.
- [ ] Write `main.js`: IntersectionObserver adds `.in` to `.reveal`; accordion toggles `.open`.
- [ ] Verify: open `preview/index.html` placeholder in browser, fonts render.

### Task 2: Variant A desktop and mobile (`preview/a.html`)

- [ ] Build all sections from board R2-A in order: hero, Stell dir vor, Was dich erwartet, Retreats + Ort, Ein Tag full width, Unterkunft, Hosts, Galerie, FAQ, Buchungsanfrage, Footer.
- [ ] Responsive at 390px following board R2-M1: single column, hero portrait still, header with MENÜ / CARMA / BUCHEN.
- [ ] Verify in browser at 1440 and 390.

### Task 3: Variants B and C (`preview/b.html`, `preview/c.html`)

- [ ] B: chapter navigation, full-height half image half text sections.
- [ ] C: centred sections with image pairs.
- [ ] Both responsive with the same single column fallback.

### Task 4: Index page and deploy

- [ ] `preview/index.html`: short intro, three cards with screenshot, link to each variant, note that A is the detailed one.
- [ ] `vercel deploy preview --prod --yes` as new project `carma-preview`.
- [ ] Commit `preview/` and `docs/` on branch `preview-site`.
