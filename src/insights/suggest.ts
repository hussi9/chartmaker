// Three ranked chart suggestions from the shape of the data. Rules, not a model.
import type { ChartType, Row } from '../chart/types';
import { looksLikeDates } from './index';

export interface Suggestion { type: ChartType; reason: string }

function uniq(list: Suggestion[]): Suggestion[] {
  const seen = new Set<ChartType>();
  return list.filter((s) => (seen.has(s.type) ? false : (seen.add(s.type), true))).slice(0, 3);
}

export function suggest(rows: Row[]): Suggestion[] {
  const valid = rows.filter((r) => Number.isFinite(r.value));
  const n = valid.length;
  if (n === 0) return [];
  const hasXY = valid.every((r) => typeof r.x === 'number' && typeof r.y === 'number');
  const total = valid.reduce((a, r) => a + r.value, 0);
  const nonNeg = valid.every((r) => r.value >= 0);
  const sorted = [...valid].sort((a, b) => b.value - a.value);
  const dominant = n >= 2 && sorted[1].value > 0 && sorted[0].value / sorted[1].value >= 1.5;
  const monotonicDown = n >= 3 && valid.every((r, i) => i === 0 || r.value <= valid[i - 1].value);

  if (hasXY && n >= 2) {
    return uniq([
      { type: 'matrix', reason: 'Every row has an x and a y' },
      { type: 'scatter', reason: 'Plain points on two axes' },
      { type: 'bar', reason: 'Values side by side' },
    ]);
  }
  if (n === 1) {
    return uniq([
      { type: 'kpi', reason: 'One number, said big' },
      { type: 'bar', reason: 'A single bar for scale' },
      { type: 'gauge', reason: 'Progress toward a target' },
    ]);
  }
  if (n === 2) {
    return uniq([
      { type: 'bar', reason: 'Before / after, two points side by side' },
      { type: 'kpi', reason: 'Headline number with the change' },
      { type: 'horizontalBar', reason: 'Two bars, long labels welcome' },
    ]);
  }
  if (looksLikeDates(valid)) {
    return uniq([
      { type: 'line', reason: 'Labels read as dates, so show the trend' },
      { type: 'area', reason: 'Same trend with the volume filled in' },
      { type: 'bar', reason: 'One column per period' },
    ]);
  }
  if (nonNeg && Math.abs(total - 100) <= 1) {
    return uniq([
      { type: 'donut', reason: 'Parts add up to 100' },
      { type: 'pie', reason: 'Classic parts of a whole' },
      { type: 'horizontalBar', reason: 'Ranked, easier to compare' },
    ]);
  }
  if (monotonicDown && nonNeg) {
    return uniq([
      { type: 'funnel', reason: 'Values decrease stage by stage, a drop-off' },
      { type: 'horizontalBar', reason: 'Clear ordering, easy to read at 1:1' },
      { type: 'bar', reason: 'Columns in order' },
    ]);
  }
  if (dominant && nonNeg) {
    return uniq([
      { type: 'funnel', reason: 'A ranked list with one dominant value' },
      { type: 'horizontalBar', reason: 'Clear ordering, easy to read at 1:1' },
      { type: 'donut', reason: `If these are parts of one total (${Math.round(total)})` },
    ]);
  }
  return uniq([
    { type: 'horizontalBar', reason: 'Ranked bars read well at any size' },
    { type: 'bar', reason: 'Columns side by side' },
    { type: 'donut', reason: nonNeg ? `If these are parts of one total (${Math.round(total)})` : 'Parts of a whole' },
  ]);
}
