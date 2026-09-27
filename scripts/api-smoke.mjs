// Executes the bundled functions the way Vercel will: plain Node ESM, no TS, no Vite.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const state = execFileSync('npx', ['tsx', '-e', "import('./src/codec/state.ts').then(async m => { const t = await import('./src/chart/types.ts'); process.stdout.write(m.encodeState(t.defaultSpec({ type: 'donut', text: { title: 'Smoke', source: 's' } }))); })"], { encoding: 'utf8' }).trim();

function fakeRes() {
  const r = { code: 0, headers: {}, body: null };
  r.status = (c) => { r.code = c; return r; };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; return r; };
  r.send = (b) => { r.body = b; return r; };
  return r;
}
const og = (await import('../api/_lib/og.mjs')).default;
const share = (await import('../api/_lib/share.mjs')).default;

let res = fakeRes();
await og({ query: { state }, headers: {} }, res);
const png = res.body;
if (res.code !== 200 || !Buffer.isBuffer(png) || png.toString('ascii', 1, 4) !== 'PNG') throw new Error(`og.png failed: ${res.code} ${String(res.body).slice(0, 120)}`);
console.log(`og.png ok ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} ${png.length} bytes`);

res = fakeRes();
await share({ query: { state }, headers: { host: 'chartgenie.xyz' } }, res);
if (res.code !== 200 || !/property="og:image" content="https:\/\/chartgenie\.xyz\/s\/[^"]+\/og\.png"/.test(String(res.body))) throw new Error(`share failed: ${res.code}`);
console.log('share html ok, og:image present');

res = fakeRes();
await og({ query: { state: 'not-a-state' }, headers: {} }, res);
if (res.code !== 404) throw new Error(`bad state should 404, got ${res.code}`);
console.log('bad state → 404 ok');
void readFileSync;
