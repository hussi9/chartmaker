// Colour-vision simulation and a genuinely safe palette, plus applying a brand kit to a spec.
import { converter, filterDeficiencyDeuter, filterDeficiencyProt, filterDeficiencyTrit, formatHex, parse } from 'culori';
import type { ChartSpec } from './types';
import type { BrandDoc } from '../db';

export type Deficiency = 'deuteranopia' | 'protanopia' | 'tritanopia';

// Okabe & Ito (2008), the standard colour-blind-safe qualitative set.
export const OKABE_ITO = ['#e69f00', '#56b4e9', '#009e73', '#f0e442', '#0072b2', '#d55e00', '#cc79a7', '#000000'] as const;

const toOklch = converter('oklch');
const BLACK = parse('#000000')!;
const col = (c: string) => parse(c) ?? BLACK;
const filters: Record<Deficiency, (c: string) => string> = {
  deuteranopia: (c) => formatHex(filterDeficiencyDeuter(1)(col(c))),
  protanopia: (c) => formatHex(filterDeficiencyProt(1)(col(c))),
  tritanopia: (c) => formatHex(filterDeficiencyTrit(1)(col(c))),
};

export function simulate(hex: string, kind: Deficiency): string {
  return filters[kind](hex);
}

function hue(hex: string): number | null {
  const c = toOklch(col(hex));
  return c && Number.isFinite(c.h) && (c.c ?? 0) > 0.03 ? (c.h as number) : null;
}

// Map each input colour to the closest-hue unused Okabe-Ito colour; greys take black last.
export function safePalette(palette: string[]): string[] {
  const pool = [...OKABE_ITO];
  const out: string[] = [];
  for (const p of palette.slice(0, OKABE_ITO.length)) {
    const h = hue(p);
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < pool.length; i++) {
      const ph = hue(pool[i]);
      const d = h === null || ph === null ? (h === null && ph === null ? 0 : 1000) : Math.min(Math.abs(h - ph), 360 - Math.abs(h - ph));
      if (d < bestD) { bestD = d; best = i; }
    }
    out.push(pool.splice(best, 1)[0]);
  }
  return out;
}

export function applyBrand(spec: ChartSpec, brand: BrandDoc, logoDataUrl?: string): ChartSpec {
  const palette = brand.safe ? safePalette(brand.palette) : [...brand.palette];
  return {
    ...spec,
    palette: palette.length ? palette : spec.palette,
    data: spec.data.map((r) => { const { color: _c, ...rest } = r; void _c; return rest; }),
    options: {
      ...spec.options,
      showHandle: Boolean(brand.handle) || spec.options.showHandle,
      handle: brand.handle ?? spec.options.handle,
      logoCorner: brand.corner,
      ...(logoDataUrl ? { logoDataUrl } : {}),
    },
  };
}

export async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(b);
  });
}

