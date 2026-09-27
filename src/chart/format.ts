import type { Unit, ValuesMode } from './types';

function trimZeros(s: string): string {
  return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function compact(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a >= 1e9) return `${sign}${trimZeros((a / 1e9).toFixed(1))}B`;
  if (a >= 1e6) return `${sign}${trimZeros((a / 1e6).toFixed(1))}M`;
  if (a >= 1e3) return `${sign}${trimZeros((a / 1e3).toFixed(1))}k`;
  return `${sign}${trimZeros(a.toFixed(1))}`;
}

function plain(v: number): string {
  const a = Math.abs(v);
  const s = a >= 1000 ? Math.round(a).toLocaleString('en-US') : trimZeros(a.toFixed(1));
  return (v < 0 ? '-' : '') + s;
}

export function formatNumber(v: number, unit: Unit | undefined): string {
  switch (unit) {
    case 'percent': return `${plain(v)}%`;
    case 'currency': return Math.abs(v) >= 1000 ? `${v < 0 ? '-' : ''}$${compact(Math.abs(v))}` : `${v < 0 ? '-' : ''}$${plain(Math.abs(v))}`;
    case 'compact': return compact(v);
    default: return plain(v);
  }
}

export function formatValue(v: number, unit: Unit | undefined, mode: ValuesMode, total: number): string {
  if (mode === 'none') return '';
  const n = formatNumber(v, unit);
  if (mode === 'number' || unit === 'percent' || !(total > 0)) return n;
  return `${n} · ${Math.round((v / total) * 100)}%`;
}

export function formatAxis(v: number, unit?: Unit): string {
  if (unit === 'percent') return `${plain(v)}%`;
  if (unit === 'currency') return `${v < 0 ? '-' : ''}$${compact(Math.abs(v))}`;
  return Math.abs(v) >= 1000 ? compact(v) : plain(v);
}
