import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// R23: nothing may require a Node server at runtime — static output only.
// Hosting (U11) stays undecided by design; static HTML runs anywhere.
// Base path for GitHub Pages project-site deployment: the repo name.
// Override with PUBLIC_BASE_PATH env var when moving to a custom domain.
// When base is empty (local dev), no prefix is added.
const base = process.env.PUBLIC_BASE_PATH || '/polycyclopedia';

export default defineConfig({
  site: 'https://polycyclopedia.ir',
  base,
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
    // The redirect target MUST include the base path so the meta-refresh
    // resolves to the correct location under GitHub Pages project URLs.
    '/': `${base}/fa/`,
  },
});
