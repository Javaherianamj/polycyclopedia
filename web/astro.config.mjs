import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// R23: nothing may require a Node server at runtime — static output only.
// Hosting (U11) stays undecided by design; static HTML runs anywhere.
export default defineConfig({
  site: 'https://polycyclopedia.ir',
  output: 'static',
  integrations: [react()],
  i18n: {
    locales: ['fa', 'en'],
    defaultLocale: 'fa',
    // D28: both trees are prefixed — /fa/... and /en/..., no unprefixed
    // default. The bare root is handled by the redirect below.
    routing: {
      prefixDefaultLocale: true,
    },
  },
  redirects: {
    '/': '/fa/',
  },
});
