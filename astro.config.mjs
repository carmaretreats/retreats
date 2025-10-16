import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import alpinejs from '@astrojs/alpinejs';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [
    alpinejs({ entrypoint: '/src/scripts/alpine.ts' }),
    react(),
  ],
    vite: {
    plugins: [tailwindcss()]
  },
});