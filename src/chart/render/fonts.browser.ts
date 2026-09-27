// Browser font provider: Vite inlines the three woff2 files as data URLs.
import display from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?inline';
import ui from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?inline';
import mono from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?inline';
import { setFontProvider } from './fonts-embed';

const b64 = (dataUrl: string): string => dataUrl.slice(dataUrl.indexOf(',') + 1);

setFontProvider(() => ({ display: b64(display), ui: b64(ui), mono: b64(mono) }));
