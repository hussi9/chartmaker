// Recurring charts: the same look, next period's numbers, last period faded behind.
import { db, type SeriesDoc } from './index';
import type { Row } from '../chart/types';

export type Cadence = SeriesDoc['cadence'];

function id(): string {
  return `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Adds one period in UTC, clamping the day to the target month's length.
export function nextDueAfter(from: number, cadence: Cadence): number {
  const d = new Date(from);
  if (cadence === 'weekly') return from + 7 * 86_400_000;
  const months = cadence === 'monthly' ? 1 : 3;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d.getUTCDate(), lastDay), d.getUTCHours(), d.getUTCMinutes());
}

export async function createSeries(chartId: string, cadence: Cadence): Promise<SeriesDoc> {
  const doc: SeriesDoc = { id: id(), chartId, cadence, nextDue: nextDueAfter(Date.now(), cadence), snapshots: [] };
  await db.series.put(doc);
  return doc;
}

export async function listSeries(): Promise<SeriesDoc[]> {
  return db.series.orderBy('nextDue').toArray();
}

export async function dueSeries(now = Date.now()): Promise<SeriesDoc[]> {
  return db.series.where('nextDue').belowOrEqual(now).toArray();
}

export async function skip(seriesId: string, now = Date.now()): Promise<void> {
  const s = await db.series.get(seriesId);
  if (!s) return;
  await db.series.update(seriesId, { nextDue: nextDueAfter(Math.max(s.nextDue, now), s.cadence) });
}

export interface UpdateResult { chartId: string; unmatched: string[] }

// New values are matched to the chart's rows by label (case-insensitive).
// Unmatched labels are reported, never silently dropped into the chart.
export async function applyUpdate(seriesId: string, incoming: Row[], now = Date.now()): Promise<UpdateResult> {
  const s = await db.series.get(seriesId);
  if (!s) throw new Error('Series not found');
  const chart = await db.charts.get(s.chartId);
  if (!chart) throw new Error('The chart for this series was deleted');
  const previous = chart.spec.data.map((r) => ({ ...r }));
  const byLabel = new Map(chart.spec.data.map((r) => [r.label.trim().toLowerCase(), r]));
  const unmatched: string[] = [];
  const next = chart.spec.data.map((r) => ({ ...r }));
  for (const inc of incoming) {
    const target = byLabel.get(inc.label.trim().toLowerCase());
    if (!target) { unmatched.push(inc.label); continue; }
    const i = next.findIndex((r) => r.id === target.id);
    next[i] = { ...next[i], value: inc.value, ...(inc.unit ? { unit: inc.unit } : {}) };
  }
  await db.transaction('rw', db.charts, db.series, async () => {
    await db.charts.put({ ...chart, spec: { ...chart.spec, data: next, options: { ...chart.spec.options, ghost: previous } }, updatedAt: now });
    await db.series.put({ ...s, snapshots: [...s.snapshots, { at: now, rows: previous }], nextDue: nextDueAfter(Math.max(s.nextDue, now), s.cadence) });
  });
  return { chartId: s.chartId, unmatched };
}

export async function deleteSeries(seriesId: string): Promise<void> {
  await db.series.delete(seriesId);
}

// A local notification per due date, only when the person granted permission.
// Nothing is scheduled server-side; this runs when the app is open.
export async function notifyDue(now = Date.now()): Promise<number> {
  const N = (globalThis as { Notification?: { permission: string; new (title: string, opts?: { body?: string }): unknown } }).Notification;
  if (!N || N.permission !== 'granted') return 0;
  const due = await dueSeries(now);
  let n = 0;
  for (const s of due) {
    if (s.notifiedAt && s.notifiedAt >= s.nextDue) continue;
    const chart = await db.charts.get(s.chartId);
    const title = chart?.spec.text.title || 'A recurring chart';
    try {
      new N(`${title} is due`, { body: 'Paste this period’s numbers in ChartGenie.' });
      await db.series.update(s.id, { notifiedAt: now });
      n++;
    } catch { /* notifications blocked at the OS level */ }
  }
  return n;
}
