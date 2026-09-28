// Per-route structured data (JSON-LD) for the published, indexable routes.
//
// Two nodes describe real entities that are the same on every page and are
// correctly identified by their OWN canonical URL regardless of which page
// references them (the app itself, and the organization that makes it) —
// those are safe to repeat unchanged across routes, the same way an
// Organization node commonly appears identically on every page of a site.
// Everything else must be specific to the page it ships on: a `WebPage`
// node identifying THIS url, and (for every published route except the
// homepage) a `BreadcrumbList` back to home.
//
// FAQPage is deliberately NOT emitted here: the 5 Q&As that used to ship in
// index.html's JSON-LD on every route are not rendered as visible text on
// any page (checked Templates.tsx and Landing.tsx) — unmatched structured
// data like that risks Google's structured-data spam guidance. Re-add it
// once a page actually renders that FAQ content visibly.
import { routeMetadata, type PublishedRoute } from './routeMetadata.ts';

export const SITE_URL = 'https://chartgenie.xyz';

// Verbatim from the app's own feature set (previously hand-maintained in
// index.html) — not new marketing copy.
const APP_FEATURE_LIST = [
  'Paste spreadsheet cells, CSV or a sentence; rows and units are detected',
  'Add a picture of a table and have it read on-device, no upload',
  'Three chart suggestions from the shape of the data',
  'Nineteen chart looks including funnel, KPI headline and 2x2 matrix',
  'Post sizes for X, LinkedIn, Story and decks with crop-zone overlays',
  'Post-ready checks: label contrast, text size, crop zones, alt text',
  'Export set: PNG and SVG for every size plus caption and alt text, zipped',
  'Share links that carry the chart and unfurl as a preview card',
  'Recurring charts, brand kit and JSON backup, all saved in the browser',
] as const;

export interface BreadcrumbItem { name: string; url: string }

// Home has nothing to trace back to — every other published route
// breadcrumbs back to Home.
export function breadcrumbItems(path: PublishedRoute): BreadcrumbItem[] {
  if (path === '/') return [];
  return [
    { name: 'Home', url: `${SITE_URL}/` },
    { name: routeMetadata[path].heading, url: `${SITE_URL}${path}` },
  ];
}

export function breadcrumbLd(path: PublishedRoute): Record<string, unknown> | null {
  const items = breadcrumbItems(path);
  if (items.length === 0) return null;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${path}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webPageLd(path: PublishedRoute): Record<string, unknown> {
  const meta = routeMetadata[path];
  const url = `${SITE_URL}${path}`;
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': `${SITE_URL}/#app` },
    ...(path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
  };
}

// The app and the organization: identical across every route by design.
export function sharedGraphNodes(): Record<string, unknown>[] {
  return [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      url: `${SITE_URL}/`,
      name: 'ChartGenie',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: routeMetadata['/'].description,
      featureList: [...APP_FEATURE_LIST],
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'ChartGenie',
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
    },
  ];
}

export function structuredDataGraph(path: PublishedRoute): { '@context': string; '@graph': Record<string, unknown>[] } {
  const graph = [...sharedGraphNodes(), webPageLd(path)];
  const breadcrumb = breadcrumbLd(path);
  if (breadcrumb) graph.push(breadcrumb);
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function structuredDataScript(path: PublishedRoute): string {
  return JSON.stringify(structuredDataGraph(path), null, 2);
}

// --- Sitemap -----------------------------------------------------------
// Same 4 published routes, same priority/changefreq already in
// public/sitemap.xml — only `lastmod` becomes a real, per-route input
// instead of a hand-edited date that goes stale the moment content changes.
export interface SitemapEntry { path: PublishedRoute; changefreq: string; priority: string }

export const SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/pie-chart-maker', changefreq: 'weekly', priority: '0.9' },
  { path: '/bar-graph-maker', changefreq: 'weekly', priority: '0.9' },
  { path: '/convert-excel-to-chart', changefreq: 'weekly', priority: '0.8' },
];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function buildSitemapXml(lastModByPath: Partial<Record<PublishedRoute, string>>, today = new Date().toISOString().slice(0, 10)): string {
  const urls = SITEMAP_ENTRIES.map(({ path, changefreq, priority }) => {
    const loc = `${SITE_URL}${path}`;
    const candidate = lastModByPath[path];
    const lastmod = candidate && DATE_ONLY.test(candidate) ? candidate : today;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
