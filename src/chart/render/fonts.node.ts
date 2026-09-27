// Node-side font provider (tests, Vercel function). Never imported by the browser bundle.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { setFontProvider } from './fonts-embed';

const require = createRequire(import.meta.url);
const FILES = {
  display: '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
  ui: '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
  mono: '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
} as const;

let cache: Record<keyof typeof FILES, string> | null = null;

setFontProvider(() => {
  if (!cache) {
    cache = {
      display: readFileSync(require.resolve(FILES.display)).toString('base64'),
      ui: readFileSync(require.resolve(FILES.ui)).toString('base64'),
      mono: readFileSync(require.resolve(FILES.mono)).toString('base64'),
    };
  }
  return cache;
});
