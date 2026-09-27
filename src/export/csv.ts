import type { Row } from '../chart/types';

function cell(v: string | number | undefined): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvString(rows: Row[]): string {
  const lines = ['label,value,unit'];
  for (const r of rows) lines.push([cell(r.label), cell(r.value), cell(r.unit)].join(','));
  return lines.join('\n');
}
