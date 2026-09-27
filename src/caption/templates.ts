// Deterministic captions from the title and the computed insights.
import type { ChartSpec, Tone } from '../chart/types';
import { formatNumber } from '../chart/format';
import type { Insight } from '../insights/types';

const byKind = (ins: Insight[], kind: Insight['kind']) => ins.find((i) => i.kind === kind);

export function captionFrom(spec: ChartSpec, ins: Insight[], tone: Tone): string {
  const title = spec.text.title.trim() || 'This chart';
  const rows = spec.data.filter((r) => Number.isFinite(r.value));
  if (rows.length === 0) return `${title}.`;
  const unit = rows.find((r) => r.unit)?.unit;
  const fmt = (v: number) => formatNumber(v, unit);
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const next = sorted[1];
  const total = rows.reduce((a, r) => a + r.value, 0);
  const share = byKind(ins, 'share');
  const ratio = byKind(ins, 'ratio');
  const delta = byKind(ins, 'delta');
  const ratioText = ratio ? `${(Math.round(ratio.value * 10) / 10).toFixed(1).replace(/\.0$/, '')}×` : null;

  if (rows.length === 1) {
    switch (tone) {
      case 'punchy': return `${title}: ${fmt(top.value)}. That is the number.`;
      case 'analyst': return `${title} stands at ${fmt(top.value)} (${top.label}).`;
      default: return `${title}: ${top.label} is ${fmt(top.value)}.`;
    }
  }

  if (delta) {
    const dir = delta.value >= 0 ? 'up' : 'down';
    switch (tone) {
      case 'punchy': return `${title}: ${dir} ${Math.abs(delta.value)}%. ${rows[0].label} to ${rows[rows.length - 1].label}, no detours.`;
      case 'analyst': return `${title} moved ${dir} ${Math.abs(delta.value)}% between ${rows[0].label} (${fmt(rows[0].value)}) and ${rows[rows.length - 1].label} (${fmt(rows[rows.length - 1].value)}).`;
      default: return `${title}: ${dir} ${Math.abs(delta.value)}% from ${rows[0].label} to ${rows[rows.length - 1].label}.`;
    }
  }

  const shareText = share ? `${share.value}%` : null;
  switch (tone) {
    case 'punchy':
      return ratioText && shareText
        ? `One value carries it: ${top.label} at ${fmt(top.value)} is ${ratioText} the next, and ${shareText} of everything. Where next?`
        : `${top.label} leads ${title.toLowerCase()} at ${fmt(top.value)}${shareText ? `, ${shareText} of everything` : ''}. Where next?`;
    case 'analyst':
      return shareText
        ? `${top.label} accounts for ${shareText} of the ${fmt(total)} total${next ? `; the next largest, ${next.label}, trails at ${ratioText ? `${ratioText} less` : fmt(next.value)}` : ''}.`
        : `${top.label} leads at ${fmt(top.value)}${next ? `, ahead of ${next.label} at ${fmt(next.value)}` : ''}.`;
    default:
      return `${title}: ${top.label} leads at ${fmt(top.value)}${shareText ? `, ${shareText} of the total` : ''}.`;
  }
}
