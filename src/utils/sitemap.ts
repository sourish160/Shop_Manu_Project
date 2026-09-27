export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urlsXml = entries
    .map((e) => {
      let xml = `  <url>\n    <loc>${escapeXml(e.loc)}</loc>\n`;
      if (e.lastmod) {
        xml += `    <lastmod>${e.lastmod}</lastmod>\n`;
      }
      if (e.changefreq) {
        xml += `    <changefreq>${e.changefreq}</changefreq>\n`;
      }
      if (typeof e.priority === 'number') {
        xml += `    <priority>${e.priority.toFixed(1)}</priority>\n`;
      }
      xml += `  </url>`;
      return xml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
