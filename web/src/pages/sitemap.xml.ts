import type { APIRoute } from 'astro';
import { getMaterials } from '../lib/api/client';
import { locales } from '../i18n/config';
import { gateMaterials } from '../lib/publish';

// robots.txt references this. Generated from the same getMaterials() call
// getStaticPaths already uses, at build time — not a hand-maintained list
// that drifts from the actual routes the moment a material is added.
export const GET: APIRoute = async ({ site }) => {
  const origin = site?.origin ?? 'https://polycyclopedia.ir';
  const result = await getMaterials({ limit: 200 });
  if (!result.ok) {
    throw new Error(`Failed to list materials for sitemap: ${result.error.message}`);
  }
  const materials = gateMaterials(result.data.data);

  const urls: string[] = [];
  for (const locale of locales) {
    urls.push(`${origin}/${locale}/`);
    urls.push(`${origin}/${locale}/catalog`);
    for (const material of materials) {
      urls.push(`${origin}/${locale}/m/${material.slug}/`);
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
