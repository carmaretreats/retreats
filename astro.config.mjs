import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import alpinejs from '@astrojs/alpinejs';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.carma-retreats.com/',
  output: 'static',
  adapter: netlify(),
  integrations: [
    alpinejs({ entrypoint: '/src/scripts/alpine.ts' }),
    react(),
    sitemap(),
  ],
    vite: {
    plugins: [tailwindcss()]
  },
});