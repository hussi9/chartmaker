// GET /s/:state → the SPA shell with Open Graph tags for this chart injected,
// so the link unfurls as a card. No storage, no logging of the chart.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cardDescription, cardTitle, specFromState } from './render';

export const config = { runtime: 'nodejs' };

let shellCache: string | null = null;
function shell(): string {
  if (!shellCache) shellCache = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf8');
  return shellCache;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripMeta(html: string): string {
  return html
    .replace(/<meta (?:property|name)="(?:og:[^"]+|twitter:[^"]+|description|robots)" content="[^"]*"\s*\/?>\s*/g, '')
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>\s*/g, '');
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const spec = specFromState(state);
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? 'chartgenie.xyz';
  const origin = `${proto}://${host}`;
  let html = shell();
  if (spec) {
    const title = esc(cardTitle(spec));
    const description = esc(cardDescription(spec));
    const image = `${origin}/s/${state}/og.png`;
    const url = `${origin}/s/${state}`;
    const tags = [
      `<title>${title}</title>`,
      `<meta name="description" content="${description}">`,
      `<meta name="robots" content="noindex">`,
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:url" content="${esc(url)}">`,
      `<meta property="og:image" content="${esc(image)}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
      `<meta name="twitter:image" content="${esc(image)}">`,
    ].join('\n    ');
    html = stripMeta(html).replace('</head>', `    ${tags}\n  </head>`);
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', spec ? 'public, max-age=3600' : 'no-store');
  res.status(200).send(html);
}
