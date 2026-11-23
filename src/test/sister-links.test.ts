// Sister-site links (owner request 2026-11-23): the AIMasterz tools link to each
// other from one footer-level info page only. The portal network rule forbids
// sitewide footer or nav link exchanges, so this test pins the links to
// public/privacy.html and fails if a sister domain shows up anywhere else.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(__dirname, '..', '..');
const PAGE = 'public/privacy.html';
const page = readFileSync(join(root, PAGE), 'utf8');

const SISTERS = [
  'https://makemycalculator.com/',
  'https://moneyvibe.ai/',
  'https://signaturemaker.app/',
];
const BUILDER = 'https://aimasterz.com/';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mts|mjs|js|html|txt|json|xml|css)$/.test(name)) out.push(p);
  }
  return out;
}

describe('sister-site links', () => {
  it('lists each sister tool once on the privacy page under "Our other free tools"', () => {
    expect(page).toContain('Our other free tools');
    for (const url of SISTERS) {
      const count = page.split(`href="${url}"`).length - 1;
      expect(count, url).toBe(1);
    }
    expect(page).not.toContain('chartgenie.xyz');
  });

  it('names AIMasterz as the builder with one link', () => {
    expect(page.split(`href="${BUILDER}"`).length - 1).toBe(1);
    expect(page).toMatch(/built by <a href="https:\/\/aimasterz\.com\/">AIMasterz<\/a>/i);
  });

  it('keeps the SignatureMaker line true to its local-processing promise', () => {
    const line = page.match(/<li><a href="https:\/\/signaturemaker\.app\/">[^]*?<\/li>/)?.[0] ?? '';
    expect(line).toMatch(/in your browser/);
    expect(line).not.toMatch(/cloud|upload(?!ed)|legally binding/i);
  });

  it('puts no sister domain in any other shipped file (no sitewide link exchange)', () => {
    const files = [
      join(root, 'index.html'),
      ...walk(join(root, 'src')),
      ...walk(join(root, 'public')),
      ...walk(join(root, 'scripts')),
      ...walk(join(root, 'server')),
      ...walk(join(root, 'api')),
    ];
    const pattern = /makemycalculator\.com|moneyvibe\.ai|signaturemaker\.app|https?:\/\/aimasterz\.com/;
    const offenders = files
      .map((f) => relative(root, f))
      .filter((f) => f !== PAGE && f !== 'src/test/sister-links.test.ts')
      .filter((f) => pattern.test(readFileSync(join(root, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
