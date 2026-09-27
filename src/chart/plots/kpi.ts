import type { PlotDef } from './types';
import { FONT_STACK } from '../echarts';
import { formatNumber } from '../format';
import { baseOption, needRows } from './common';

export const kpi: PlotDef = {
  type: 'kpi',
  name: 'KPI Headline',
  category: 'kpis',
  blurb: 'One big number and how it moved. Second row is the previous value.',
  sample: [
    { id: 'k1', label: 'Retention', value: 87, unit: 'percent' },
    { id: 'k2', label: 'Last quarter', value: 75, unit: 'percent' },
  ],
  accepts: (rows) => needRows(rows, 1, 'A KPI headline'),
  build(ctx) {
    const { rows, look, plot } = ctx;
    const now = rows[0];
    const prev = rows[1];
    const unit = now.unit ?? ctx.unit;
    const big = Math.round(plot.h * 0.42);
    const value = formatNumber(now.value, unit);
    const graphic: Record<string, unknown>[] = [
      { type: 'text', left: 0, top: Math.round(plot.h * 0.18), style: { text: value, fontFamily: FONT_STACK.display, fontSize: big, fontWeight: 800, fill: look.ink, lineHeight: big } },
      { type: 'text', left: 0, top: Math.round(plot.h * 0.18) + big + 12, style: { text: now.label, fontFamily: FONT_STACK.ui, fontSize: Math.round(look.label * 1.3), fill: look.muted } },
    ];
    if (prev && Number.isFinite(prev.value)) {
      const diff = now.value - prev.value;
      const up = diff >= 0;
      const deltaText = unit === 'percent'
        ? `${formatNumber(Math.abs(diff), 'number')} pts`
        : `${formatNumber(Math.abs(diff), unit)}${prev.value ? ` · ${Math.round((Math.abs(diff) / Math.abs(prev.value)) * 100)}%` : ''}`;
      const wBig = ctx.m.width(value, big, 'display', 800);
      const deltaSize = Math.round(look.label * 1.3);
      const tri = Math.round(deltaSize * 0.55);
      const dx = Math.round(wBig + 18);
      const dy = Math.round(plot.h * 0.18) + Math.round(big * 0.62);
      const fill = up ? '#0e9384' : '#e26d5a';
      graphic.push({
        type: 'polygon',
        x: dx,
        y: dy + Math.round((deltaSize - tri) / 2),
        shape: { points: up ? [[0, tri], [tri, tri], [tri / 2, 0]] : [[0, 0], [tri, 0], [tri / 2, tri]] },
        style: { fill },
        name: up ? 'delta-up' : 'delta-down',
      });
      graphic.push({
        type: 'text',
        left: dx + tri + 8,
        top: dy,
        style: { text: deltaText, fontFamily: FONT_STACK.mono, fontSize: deltaSize, fontWeight: 600, fill },
      });
      graphic.push({
        type: 'text',
        left: Math.round(wBig + 18),
        top: Math.round(plot.h * 0.18) + Math.round(big * 0.62) + Math.round(look.label * 1.6),
        style: { text: `vs ${prev.label} (${formatNumber(prev.value, unit)})`, fontFamily: FONT_STACK.ui, fontSize: look.label, fill: look.muted },
      });
    }
    return { ...baseOption(ctx), grid: undefined, xAxis: { show: false }, yAxis: { show: false }, series: [], graphic } as ReturnType<PlotDef['build']>;
  },
};
