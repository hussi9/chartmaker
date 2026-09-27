import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('published claims', () => {
  for (const path of ['index.html', 'public/llms.txt', 'public/manifest.json', 'README.md']) {
    it(`${path} omits unsupported AI, rating, DPI, lossless, and absolute privacy claims`, () => {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/aggregateRating|reviewCount|300 DPI|lossless|AI chart|AI-powered|AI-assisted|data never leaves|never leaves your browser|100% private|instant AI/i);
    });
  }
});
