// Provider registry for embedding the three fonts as @font-face data URIs.
// The browser bundle registers inlined woff2 (fonts.browser.ts); Node registers
// a file reader (fonts.node.ts). svgString itself stays environment-free.
import type { FontRole } from '../measure';

export type FontProvider = () => Record<FontRole, string> | null; // base64 woff2 per role

let provider: FontProvider = () => null;

export function setFontProvider(p: FontProvider): void {
  provider = p;
}

const FAMILY: Record<FontRole, string> = {
  display: 'Bricolage Grotesque Variable',
  ui: 'Geist Variable',
  mono: 'Geist Mono Variable',
};

export function fontFaceCss(): string {
  const fonts = provider();
  if (!fonts) return '';
  return (Object.keys(FAMILY) as FontRole[])
    .map((role) => `@font-face{font-family:'${FAMILY[role]}';font-weight:100 900;src:url(data:font/woff2;base64,${fonts[role]}) format('woff2');}`)
    .join('');
}
