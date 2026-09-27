// Server-side chart rendering for link cards. Stateless: decode → validate → SVG → PNG.
// Nothing is stored and the decoded spec is never logged.
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { decodeState } from '../../src/codec/state';
import { svgString } from '../../src/chart/render/svgString';
import { metricsMeasurer } from '../../src/chart/measure';
import type { ChartSpec } from '../../src/chart/types';

const FONT_DIR = join(process.cwd(), 'api', '_fonts');
const FONT_FILES = ['BricolageGrotesque.ttf', 'Geist.ttf', 'GeistMono.ttf'].map((f) => join(FONT_DIR, f));

export function specFromState(state: unknown): ChartSpec | null {
  if (typeof state !== 'string' || state.length === 0 || state.length > 16_000) return null;
  return decodeState(state);
}

export function cardSvg(spec: ChartSpec): string {
  return svgString(spec, { measure: metricsMeasurer(), embedFonts: false });
}

export function cardPng(spec: ChartSpec, width = 1200): Buffer {
  const r = new Resvg(cardSvg(spec), {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Geist Variable' },
  });
  return r.render().asPng();
}

export function cardTitle(spec: ChartSpec): string {
  const t = spec.text.title.trim();
  return t ? `${t} — ChartGenie` : 'A chart — ChartGenie';
}

export function cardDescription(spec: ChartSpec): string {
  const cap = spec.caption?.text?.trim();
  if (cap) return cap.slice(0, 200);
  const rows = spec.data.slice(0, 3).map((r) => `${r.label} ${r.value}`).join(', ');
  return `${spec.data.length} rows${rows ? `: ${rows}` : ''}${spec.data.length > 3 ? '…' : ''}. Made with ChartGenie, free, in the browser.`;
}
