import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import alpinejs from '@astrojs/alpinejs';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// Der Netlify-Adapter startet lokal einen Deno-Edge-Server, der auf dieser Maschine nicht hochkommt.
// Fuer `astro dev` lassen wir ihn weg, Builds und Deploys nutzen ihn unveraendert.
const isDev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://www.carma-retreats.com/',
  output: 'server',
  ...(isDev ? {} : { adapter: netlify() }),
  integrations: [
    alpinejs({ entrypoint: '/src/scripts/alpine.ts' }),
    react(),
    sitemap(),
  ],
    vite: {
    plugins: [tailwindcss()]
  },
});