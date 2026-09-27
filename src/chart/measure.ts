// Text measurement. The browser measures with a 2D canvas; the server (and
// tests) use shipped advance-width tables so both sides lay out the same.
import display from './metrics/display.json';
import ui from './metrics/ui.json';
import mono from './metrics/mono.json';

export type FontRole = 'display' | 'ui' | 'mono';

export interface TextMeasurer {
  width(text: string, size: number, role: FontRole, weight?: number): number;
}

interface MetricsTable { family: string; unitsPerEm: number; avg: number; glyphs: Record<string, number> }

export const FONT_FAMILY: Record<FontRole, string> = {
  display: "'Bricolage Grotesque Variable', system-ui, sans-serif",
  ui: "'Geist Variable', system-ui, sans-serif",
  mono: "'Geist Mono Variable', ui-monospace, monospace",
};

export const DEFAULT_WEIGHT: Record<FontRole, number> = { display: 800, ui: 500, mono: 500 };

const TABLES: Record<FontRole, MetricsTable> = { display, ui, mono };

// Variable-font tables are captured at the default instance (wght 400).
// Heavier weights widen glyphs slightly; 6% at 800 matches the shipped fonts within a few px.
function weightFactor(weight: number): number {
  return 1 + Math.max(0, weight - 400) * 0.00015;
}

export function metricsMeasurer(): TextMeasurer {
  return {
    width(text, size, role, weight = DEFAULT_WEIGHT[role]) {
      if (!text) return 0;
      const t = TABLES[role];
      let units = 0;
      for (const ch of text) units += t.glyphs[ch] ?? t.avg;
      return (units / t.unitsPerEm) * size * weightFactor(weight);
    },
  };
}

export function canvasMeasurer(): TextMeasurer {
  const fallback = metricsMeasurer();
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    if (typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) return fallback;
  const c = ctx;
  return {
    width(text, size, role, weight = DEFAULT_WEIGHT[role]) {
      if (!text) return 0;
      c.font = `${weight} ${size}px ${FONT_FAMILY[role]}`;
      const w = c.measureText(text).width;
      return Number.isFinite(w) && w > 0 ? w : fallback.width(text, size, role, weight);
    },
  };
}

export function defaultMeasurer(): TextMeasurer {
  return typeof document !== 'undefined' ? canvasMeasurer() : metricsMeasurer();
}
