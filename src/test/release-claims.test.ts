import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Every user-facing claim must be true of the code. These phrases are not.
const FORBIDDEN = /aggregateRating|reviewCount|300 DPI|lossless|AI chart|AI-powered|AI-assisted|data never leaves|never leaves your browser|100% private|instant AI|view count|views counted|synced across|we'll remind you|we will remind you|sign in later|sign-in later|only when you save|charts you save|when you save/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!/node_modules|\.archive|metrics|__snapshots__/.test(p)) walk(p, out); }
    else if (/\.(tsx?|html|txt|json|webmanifest|md)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('published claims', () => {
  const files = ['index.html', 'public/llms.txt', 'public/manifest.webmanifest', 'README.md', ...walk('src'), ...walk('api'), ...walk('server')];
  for (const path of files) {
    it(`${path} omits unsupported claims`, () => {
      const source = readFileSync(path, 'utf8');
      const hit = FORBIDDEN.exec(source);
      expect(hit, hit ? `found “${hit[0]}” in ${path}` : undefined).toBeNull();
    });
  }

  it('the chart-type count in copy comes from the registry, never a literal', () => {
    for (const path of walk('src').filter((p) => /\.tsx$/.test(p))) {
      const src = readFileSync(path, 'utf8');
      expect(src, path).not.toMatch(/\b(17|19|20) (chart types|looks)\b/);
    }
  });

  it('the handle is never hardcoded', () => {
    for (const path of [...walk('src'), 'index.html', 'public/llms.txt']) {
      expect(readFileSync(path, 'utf8'), path).not.toMatch(/@Hussain/);
    }
  });
});

describe('manifest share target', () => {
  it('accepts a shared image via POST, not the old GET-only form', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
    expect(manifest.share_target.method).toBe('POST');
    expect(manifest.share_target.enctype).toBe('multipart/form-data');
    expect(manifest.share_target.files).toEqual([{ name: 'image', accept: ['image/*'] }]);
    expect(manifest.file_handlers.some((h: { accept: Record<string, string[]> }) => 'image/*' in h.accept)).toBe(true);
  });
});

describe('picture-intake claims stay honest', () => {
  // Excludes the sanctioned negated phrasing ("nothing is sent to a server", "never sent") this repo already uses to make the true privacy claim.
  const FORBIDDEN_PICTURE_CLAIMS = /works on (all|every) (browser|phone|device)|available on iphone|available on ios|(?<!nothing )(?<!never )\bis sent to (?:our|a) server\b|cloud (ocr|vision|api)/i;
  it('no copy overclaims the picture/share-target feature', () => {
    for (const path of ['public/llms.txt', 'README.md', 'index.html']) {
      expect(readFileSync(path, 'utf8'), path).not.toMatch(FORBIDDEN_PICTURE_CLAIMS);
    }
  });
});
