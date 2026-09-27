// Plain statistics about the rows, worded the way the chart will say them.
// No model, no network: every sentence is derivable from the numbers.
import { max, mean, min, sum } from 'd3-array';
import type { Row, Unit } from '../chart/types';
import { formatNumber } from '../chart/format';
import type { Insight } from './types';

export type { Insight, InsightKind } from './types';

const DATE_RE = /^(\d{4}(-\d{2})?|(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?( \d{2,4})?|q[1-4]( \d{4})?|w(ee)?k ?\d+|h[12]( \d{4})?|(mon|tue|wed|thu|fri|sat|sun)[a-z]*)$/i;

export function looksLikeDates(rows: Row[]): boolean {
  return rows.length >= 2 && rows.every((r) => DATE_RE.test(r.label.trim()));
}

function unitOf(rows: Row[]): Unit | undefined {
  const counts = new Map<Unit, number>();
  for (const r of rows) if (r.unit) counts.set(r.unit, (counts.get(r.unit) ?? 0) + 1);
  let best: Unit | undefined;
  let n = 0;
  for (const [u, c] of counts) if (c > n) { n = c; best = u; }
  return best;
}

const fmtRatio = (r: number): string => (Math.round(r * 10) / 10).toFixed(1).replace(/\.0$/, '');

export function insights(rows: Row[]): Insight[] {
  const valid = rows.filter((r) => Number.isFinite(r.value));
  if (valid.length === 0) return [];
  const unit = unitOf(valid);
  const fmt = (v: number) => formatNumber(v, unit);
  const total = sum(valid, (r) => r.value);
  const out: Insight[] = [];

  const sorted = [...valid].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const next = sorted[1];
  const last = sorted[sorted.length - 1];

  if (next && next.value > 0 && top.value / next.value >= 1.5) {
    out.push({ id: 'ratio', kind: 'ratio', text: `${top.label} is ${fmtRatio(top.value / next.value)}× the next value`, rowId: top.id, value: top.value / next.value });
  }
  out.push({ id: 'largest', kind: 'largest', text: `${top.label} is the largest at ${fmt(top.value)}`, rowId: top.id, value: top.value });

  if (valid.length >= 2 && total > 0 && unit !== 'percent' && valid.every((r) => r.value >= 0)) {
    const share = Math.round((top.value / total) * 100);
    out.push({ id: 'share', kind: 'share', text: `${top.label} holds ${share}% of the total`, rowId: top.id, value: share });
  }

  if (valid.length >= 2 && last.id !== top.id) {
    out.push({ id: 'smallest', kind: 'smallest', text: `${last.label} is the smallest at ${fmt(last.value)}`, rowId: last.id, value: last.value });
  }

  if (looksLikeDates(valid)) {
    const first = valid[0];
    const end = valid[valid.length - 1];
    if (first.value !== 0) {
      const pct = Math.round(((end.value - first.value) / Math.abs(first.value)) * 100);
      out.push({ id: 'delta', kind: 'delta', text: `${pct >= 0 ? 'Up' : 'Down'} ${Math.abs(pct)}% from ${first.label} to ${end.label}`, rowId: end.id, value: pct });
    }
    let ups = 0;
    let downs = 0;
    for (let i = 1; i < valid.length; i++) (valid[i].value >= valid[i - 1].value ? ups++ : downs++);
    const dir = ups > downs ? 'Rising' : downs > ups ? 'Falling' : 'Flat';
    out.push({ id: 'trend', kind: 'trend', text: `${dir} over ${valid.length} periods`, value: ups - downs });
  }

  if (valid.length >= 2) {
    const avg = mean(valid, (r) => r.value) ?? 0;
    out.push({ id: 'average', kind: 'average', text: `Average is ${fmt(avg)}`, value: avg });
  }

  if (valid.length >= 2 && Math.abs(total - 100) <= 1 && (min(valid, (r) => r.value) ?? 0) >= 0) {
    out.push({ id: 'sum100', kind: 'sum100', text: 'Parts add up to 100%', value: total });
  }

  void max;
  return out.slice(0, 6);
}
