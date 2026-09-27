import type { ChartSpec, ChartType } from '../types';
import type { Frame } from '../layout-types';
import type { TextMeasurer } from '../measure';
import { LOOKS } from '../types';
import { formatValue } from '../format';
import type { PlotCtx, PlotDef } from './types';
import { MAX_ROWS } from './common';
import { bar } from './bar';

const DEFS: PlotDef[] = [bar];

export const PLOTS = Object.fromEntries(DEFS.map((d) => [d.type, d])) as Record<ChartType, PlotDef>;

export function plotContext(spec: ChartSpec, f: Frame, m: TextMeasurer): PlotCtx {
  const all = spec.data;
  const capped = Math.max(0, all.length - MAX_ROWS);
  const palette = spec.palette.length ? spec.palette : ['#1e293b'];
  const rows = all.slice(0, MAX_ROWS).map((r, i) => ({ ...r, color: r.color ?? palette[i % palette.length] }));
  const total = rows.reduce((a, r) => a + (Number.isFinite(r.value) ? r.value : 0), 0);
  const unit = majorityUnit(rows);
  return {
    spec, rows, plot: f.plot, look: LOOKS[spec.look], palette, total, capped, m, unit,
    fmt: (v, rowUnit) => formatValue(v, rowUnit ?? unit, spec.values, total),
  };
}

function majorityUnit(rows: { unit?: PlotCtx['unit'] }[]): PlotCtx['unit'] {
  const counts = new Map<string, number>();
  for (const r of rows) if (r.unit) counts.set(r.unit, (counts.get(r.unit) ?? 0) + 1);
  let best: PlotCtx['unit'];
  let n = 0;
  for (const [u, c] of counts) if (c > n) { n = c; best = u as PlotCtx['unit']; }
  return best;
}

export type { PlotCtx, PlotDef, PlotCategory, Accepts } from './types';
