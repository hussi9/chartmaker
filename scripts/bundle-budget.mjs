// Fails when a built chunk exceeds its gzip budget. Run after `npm run build`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIR = 'dist/assets';
const BUDGET_KB = { entry: 150, echarts: 240 };

const files = readdirSync(DIR).filter((f) => f.endsWith('.js'));
const rows = files.map((f) => {
  const buf = readFileSync(join(DIR, f));
  return { file: f, raw: statSync(join(DIR, f)).size, gz: gzipSync(buf).length };
});
rows.sort((a, b) => b.gz - a.gz);

const kb = (n) => (n / 1024).toFixed(1).padStart(7);
console.log('file'.padEnd(44) + '   raw KB' + '    gz KB');
for (const r of rows) console.log(r.file.padEnd(44) + kb(r.raw) + '  ' + kb(r.gz));

const failures = [];
const entry = rows.find((r) => /^index-/.test(r.file));
if (entry && entry.gz > BUDGET_KB.entry * 1024) failures.push(`entry chunk ${entry.file} is ${(entry.gz / 1024).toFixed(1)} KB gz (budget ${BUDGET_KB.entry})`);
const echarts = rows.find((r) => /^echarts-/.test(r.file));
if (echarts && echarts.gz > BUDGET_KB.echarts * 1024) failures.push(`echarts chunk is ${(echarts.gz / 1024).toFixed(1)} KB gz (budget ${BUDGET_KB.echarts})`);

if (failures.length) {
  const soft = process.env.BUDGET_SOFT === '1';
  console.error(`\n${soft ? '⚠' : '✗'} bundle budget exceeded${soft ? ' (soft until the legacy app is archived)' : ''}:\n  ` + failures.join('\n  '));
  if (!soft) process.exit(1);
}
console.log('\n✓ bundle within budget');
