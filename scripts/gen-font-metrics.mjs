// Generates (1) advance-width tables for server-side text measurement and
// (2) TTF copies of the three variable fonts + the resvg wasm for the export worker.
// Run: node scripts/gen-font-metrics.mjs   (idempotent; outputs are committed)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const { decompress } = require('wawoff2');

const FONTS = [
  { role: 'display', pkg: '@fontsource-variable/bricolage-grotesque', file: 'bricolage-grotesque-latin-wght-normal.woff2', out: 'BricolageGrotesque.ttf' },
  { role: 'ui', pkg: '@fontsource-variable/geist', file: 'geist-latin-wght-normal.woff2', out: 'Geist.ttf' },
  { role: 'mono', pkg: '@fontsource-variable/geist-mono', file: 'geist-mono-latin-wght-normal.woff2', out: 'GeistMono.ttf' },
];

// ASCII printable + Latin-1 supplement + symbols the app renders in labels.
const CHARS = [];
for (let c = 0x20; c <= 0x7e; c++) CHARS.push(String.fromCharCode(c));
for (let c = 0xa0; c <= 0xff; c++) CHARS.push(String.fromCharCode(c));
CHARS.push(...'–—…·•×→←↑↓▲▼€£¥‰′″‘’“”');

mkdirSync('src/chart/metrics', { recursive: true });
mkdirSync('public/fonts', { recursive: true });

for (const f of FONTS) {
  const woff2 = readFileSync(require.resolve(`${f.pkg}/files/${f.file}`));
  const ttf = Buffer.from(await decompress(woff2));
  writeFileSync(join('public/fonts', f.out), ttf);
  const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
  const glyphs = {};
  let sum = 0;
  let n = 0;
  for (const ch of CHARS) {
    const g = font.charToGlyph(ch);
    if (!g || g.index === 0) continue;
    glyphs[ch] = g.advanceWidth;
    sum += g.advanceWidth;
    n++;
  }
  const table = { family: font.names.fontFamily?.en ?? f.role, unitsPerEm: font.unitsPerEm, avg: Math.round(sum / n), glyphs };
  writeFileSync(join('src/chart/metrics', `${f.role}.json`), JSON.stringify(table));
  console.log(`${f.role}: ${n} glyphs, upm ${font.unitsPerEm}, avg ${table.avg} → ${f.out}`);
}

copyFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm'), 'public/resvg.wasm');
console.log('copied resvg.wasm');
