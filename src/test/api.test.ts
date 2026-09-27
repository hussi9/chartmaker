// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { encodeState } from '@/codec/state';
import { defaultSpec } from '@/chart/types';

vi.mock('node:fs', async (orig) => {
  const real = await orig<typeof import('node:fs')>();
  return { ...real, readFileSync: (p: string, enc?: unknown) => (String(p).endsWith('index.html') ? '<!doctype html><html><head><title>ChartGenie</title><meta name="description" content="x"><meta property="og:title" content="x"><meta property="og:image" content="x"></head><body><div id="root"></div></body></html>' : real.readFileSync(p, enc as never)) };
});

function mockRes() {
  const headers: Record<string, string> = {};
  let body: unknown;
  let status = 200;
  const res = {
    setHeader: (k: string, v: string) => { headers[k.toLowerCase()] = v; },
    status: (s: number) => { status = s; return res; },
    send: (b: unknown) => { body = b; return res; },
    end: (b?: unknown) => { body = b; return res; },
    json: (b: unknown) => { body = JSON.stringify(b); return res; },
    get: () => ({ headers, body, status }),
  };
  return res;
}

describe('api/og', () => {
  it('returns an immutable PNG for a valid state', async () => {
    const { default: handler } = await import('../../server/og');
    const res = mockRes();
    await handler({ query: { state: encodeState(defaultSpec()) }, headers: {} } as never, res as never);
    const { headers, body, status } = res.get();
    expect(status).toBe(200);
    expect(headers['content-type']).toBe('image/png');
    expect(headers['cache-control']).toContain('immutable');
    expect(Buffer.isBuffer(body)).toBe(true);
    expect((body as Buffer).subarray(1, 4).toString('ascii')).toBe('PNG');
    expect((body as Buffer).readUInt32BE(16)).toBe(1200);
  }, 30_000);

  it('404s an invalid state without echoing it', async () => {
    const { default: handler } = await import('../../server/og');
    const res = mockRes();
    await handler({ query: { state: 'zzz-not-a-state' }, headers: {} } as never, res as never);
    expect(res.get().status).toBe(404);
    expect(String(res.get().body)).not.toContain('zzz');
  });
});

describe('api/share', () => {
  it('injects og tags pointing at the card for a valid state', async () => {
    const { default: handler } = await import('../../server/share');
    const res = mockRes();
    const state = encodeState(defaultSpec({ text: { title: 'Countries' } }));
    await handler({ query: { state }, headers: { host: 'chartgenie.xyz' } } as never, res as never);
    const { headers, body, status } = res.get();
    expect(status).toBe(200);
    expect(headers['content-type']).toContain('text/html');
    const html = String(body);
    expect(html).toContain(`<meta property="og:image" content="https://chartgenie.xyz/s/${state}/og.png"`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(html).toContain('<meta property="og:title" content="Countries — ChartGenie"');
    expect(html).toContain('<meta name="robots" content="noindex"');
    expect(html.match(/<meta property="og:image"/g)).toHaveLength(1);
  });

  it('serves the plain shell for an invalid state', async () => {
    const { default: handler } = await import('../../server/share');
    const res = mockRes();
    await handler({ query: { state: 'nope' }, headers: { host: 'chartgenie.xyz' } } as never, res as never);
    expect(res.get().status).toBe(200);
    expect(String(res.get().body)).not.toContain('/og.png');
  });
});

describe('card shape (review item 9)', () => {
  it('renders the card as 16:9 whatever the post size, and says so in the tags', async () => {
    const og = (await import('../../server/og')).default;
    const share = (await import('../../server/share')).default;
    const state = encodeState(defaultSpec({ size: '9:16', text: { title: 'Story' } }));
    let res = mockRes();
    await og({ query: { state }, headers: {} } as never, res as never);
    const png = res.get().body as Buffer;
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(675);
    res = mockRes();
    await share({ query: { state }, headers: { host: 'chartgenie.xyz' } } as never, res as never);
    expect(String(res.get().body)).toContain('<meta property="og:image:height" content="675">');
  }, 30_000);
});
