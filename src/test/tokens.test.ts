import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = readFileSync('src/design/tokens.css', 'utf8');

describe('design tokens', () => {
  it.each([
    '--paper:#f6f3ee',
    '--ink:#1e293b',
    '--teal:#0e9384',
    '--teal-bright:#2dd4bf',
    '--amber:#e0a33a',
    '--coral:#e26d5a',
    '--line:#d6d0c6',
    '--line-2:#e3ded6',
    '--rail:#1e293b',
  ])('defines %s', (pair) => {
    const [k, v] = pair.split(':');
    expect(css.replace(/\s/g, '')).toContain(`${k}:${v}`);
  });

  it('uses self-hosted fonts only', () => {
    expect(readFileSync('src/index.css', 'utf8')).not.toMatch(/fonts\.googleapis/);
    expect(readFileSync('index.html', 'utf8')).not.toMatch(/fonts\.googleapis/);
  });

  it('imports the three variable fonts', () => {
    const fonts = readFileSync('src/design/fonts.ts', 'utf8');
    for (const f of ['bricolage-grotesque', 'geist', 'geist-mono']) {
      expect(fonts).toContain(`@fontsource-variable/${f}`);
    }
  });
});
