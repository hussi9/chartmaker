import type { ChartSpec } from './types';
import type { Insight } from '../insights/types';
import { formatNumber } from './format';

export function altText(spec: ChartSpec, insights: Insight[]): string {
  const title = spec.text.title.trim();
  if (!title) return '';
  const top = insights[0]?.text;
  if (top) return `${title}: ${top}`;
  const rows = spec.data;
  if (rows.length === 0) return title;
  const lead = rows.slice(0, 3).map((r) => `${r.label} ${formatNumber(r.value, r.unit)}`).join(', ');
  return `${title}: ${rows.length} rows, ${lead}${rows.length > 3 ? '…' : ''}`;
}
