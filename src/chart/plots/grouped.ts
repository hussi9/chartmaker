// Rows carrying `group` become one series per group over the distinct labels.
// Rows without a group each become their own series named by their label.
import type { Row } from '../types';

export interface Grouped { categories: string[]; series: { name: string; color: string; values: (number | null)[] }[] }

export function grouped(rows: Row[], palette: string[]): Grouped {
  const hasGroups = rows.some((r) => r.group);
  if (!hasGroups) {
    return {
      categories: ['Total'],
      series: rows.map((r, i) => ({ name: r.label, color: r.color ?? palette[i % palette.length], values: [r.value] })),
    };
  }
  const categories = [...new Set(rows.map((r) => r.label))];
  const names = [...new Set(rows.map((r) => r.group as string))];
  const series = names.map((name, i) => {
    const color = rows.find((r) => r.group === name && r.color)?.color ?? palette[i % palette.length];
    const values = categories.map((c) => rows.find((r) => r.label === c && r.group === name)?.value ?? null);
    return { name, color, values };
  });
  return { categories, series };
}

export function normalise(g: Grouped): Grouped {
  const totals = g.categories.map((_, ci) => g.series.reduce((a, s) => a + (s.values[ci] ?? 0), 0));
  return {
    categories: g.categories,
    series: g.series.map((s) => ({ ...s, values: s.values.map((v, ci) => (v == null || totals[ci] === 0 ? null : Math.round((v / totals[ci]) * 1000) / 10)) })),
  };
}

export const STACKED_SAMPLE: Row[] = [
  { id: 'g1', label: 'Q1', group: 'Starter', value: 12 }, { id: 'g2', label: 'Q1', group: 'Pro', value: 20 }, { id: 'g3', label: 'Q1', group: 'Team', value: 8 },
  { id: 'g4', label: 'Q2', group: 'Starter', value: 14 }, { id: 'g5', label: 'Q2', group: 'Pro', value: 26 }, { id: 'g6', label: 'Q2', group: 'Team', value: 11 },
  { id: 'g7', label: 'Q3', group: 'Starter', value: 15 }, { id: 'g8', label: 'Q3', group: 'Pro', value: 31 }, { id: 'g9', label: 'Q3', group: 'Team', value: 16 },
];

export const TREND_SAMPLE: Row[] = [
  { id: 't1', label: 'Jan', value: 12 }, { id: 't2', label: 'Feb', value: 15 }, { id: 't3', label: 'Mar', value: 14 },
  { id: 't4', label: 'Apr', value: 22 }, { id: 't5', label: 'May', value: 27 }, { id: 't6', label: 'Jun', value: 34 },
];
