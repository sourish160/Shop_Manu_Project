import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@insforge/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = process.env.VITE_INSFORGE_URL || 'https://yke9qwgm.us-east.insforge.app';
const ANON_KEY = process.env.VITE_INSFORGE_ANON_KEY || 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';
const SITE_URL = process.env.SITE_URL || 'https://shopmanu.com';

async function generateSitemap() {
  console.log('Generating production sitemap for ShopManu...');
  const client = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

  // 1. Static Public Pages
  const entries = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${SITE_URL}/search`, changefreq: 'daily', priority: 0.8 },
    { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: 0.3 },
    { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: 0.3 },
  ];

  // 2. Fetch strictly approved restaurants
  try {
    const { data: restaurants, error } = await client.database
      .from('restaurants')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch approved restaurants for sitemap:', error.message);
    } else if (restaurants && restaurants.length > 0) {
      restaurants.forEach((r) => {
        entries.push({
          loc: `${SITE_URL}/restaurant/${r.slug}`,
          lastmod: r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : undefined,
          changefreq: 'weekly',
          priority: 0.7,
        });
      });
      console.log(`Added ${restaurants.length} approved restaurants to sitemap.`);
    }
  } catch (err) {
    console.warn('Error querying restaurants for sitemap:', err.message);
  }

  // 3. Build XML
  const urlsXml = entries
    .map((e) => {
      let xml = `  <url>\n    <loc>${e.loc}</loc>\n`;
      if (e.lastmod) xml += `    <lastmod>${e.lastmod}</lastmod>\n`;
      if (e.changefreq) xml += `    <changefreq>${e.changefreq}</changefreq>\n`;
      if (typeof e.priority === 'number') xml += `    <priority>${e.priority.toFixed(1)}</priority>\n`;
      xml += `  </url>`;
      return xml;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`;

  const outputPath = path.join(rootDir, 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemapXml, 'utf-8');
  console.log(`✓ Sitemap successfully generated at: ${outputPath}`);
}

generateSitemap();
