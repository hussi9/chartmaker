import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { readFileSync } from 'node:fs';

let server: ViteDevServer;
let origin: string;

beforeAll(async () => {
  server = await createServer({ configFile: 'vite.config.ts', server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Vite server did not open a port');
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => { await server?.close(); });

describe('route HTTP contract', () => {
  for (const [path, titlePart] of [
    ['/', 'ChartGenie'],
    ['/pie-chart-maker', 'Pie Chart Maker'],
    ['/bar-graph-maker', 'Bar Graph Maker'],
    ['/convert-excel-to-chart', 'Excel']
  ]) {
    it(`serves ${path} with its own canonical and title`, async () => {
      const response = await fetch(`${origin}${path}`, { headers: { accept: 'text/html' } });
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toContain(`<link rel="canonical" href="https://chartgenie.xyz${path}"`);
      expect(html).toMatch(new RegExp(`<title>[^<]*${titlePart}`));
    });
  }

  it('returns a true 404 for unknown pages and retired embeds', async () => {
    for (const path of ['/not-a-route', '/embed/test-chart']) {
      const response = await fetch(`${origin}${path}`);
      expect(response.status).toBe(404);
    }
  });

  it('only rewrites the published routes on Vercel', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    expect(config.rewrites.some((rewrite: { source: string }) => rewrite.source === '/(.*)')).toBe(false);
    for (const path of ['/pie-chart-maker', '/bar-graph-maker', '/convert-excel-to-chart']) {
      expect(config.rewrites).toContainEqual({ source: path, destination: `${path}/index.html` });
    }
  });
});
