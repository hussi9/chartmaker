// The design's funnel: centred rounded rows whose width is the value's share
// of the top row, label inset left, value inset right. Built from horizontal
// bars: a transparent offset series centres each row; a second, invisible copy
// carries the right-aligned value label.
import type { PlotDef } from './types';
import { FONT_STACK } from '../echarts';
import { baseOption, itemStyle, contrastInk, needRows, nonNegative } from './common';

export const funnel: PlotDef = {
  type: 'funnel',
  name: 'Conversion Funnel',
  category: 'funnels',
  blurb: 'Stage-by-stage drop-off, widest first.',
  sample: [
    { id: 'f1', label: 'Visited', value: 1200 },
    { id: 'f2', label: 'Signed up', value: 480 },
    { id: 'f3', label: 'Activated', value: 210 },
    { id: 'f4', label: 'Paid', value: 64 },
  ],
  accepts: (rows) => {
    const n = needRows(rows, 2, 'A funnel');
    return n.ok ? nonNegative(rows, 'A funnel') : n;
  },
  build(ctx) {
    const { rows, look, spec } = ctx;
    const top = Math.max(1, ...rows.map((r) => r.value));
    const MIN = 0.18;
    const widths = rows.map((r) => Math.max(MIN, r.value / top));
    const offsets = widths.map((w) => (1 - w) / 2);
    const labels = rows.map((r) => r.label).reverse();
    const valueText = (r: { value: number }) => {
      const pct = Math.round((r.value / top) * 100);
      if (spec.values === 'none') return '';
      if (spec.values === 'number') return ctx.fmt(r.value).split(' · ')[0];
      return `${ctx.fmt(r.value).split(' · ')[0]} · ${pct}%`;
    };
    const rev = <T,>(a: T[]) => [...a].reverse();
    const gapPct = `${Math.round(look.barGap * 100)}%`;
    const offsetSeries = { type: 'bar' as const, stack: 'f', silent: true, barCategoryGap: gapPct, itemStyle: { color: 'transparent' }, data: rev(offsets), label: { show: false }, emphasis: { disabled: true } };
    const rowSeries = {
      type: 'bar' as const,
      stack: 'f',
      barCategoryGap: gapPct,
      data: rev(rows.map((r, i) => ({ value: widths[i], itemStyle: { ...itemStyle(r.color ?? ctx.palette[0], ctx), borderRadius: look.radius }, label: { color: contrastInk(r.color ?? ctx.palette[0]) }, name: r.label }))),
      label: { show: true, position: 'insideLeft' as const, distance: 16, formatter: (p: { name: string }) => p.name, fontFamily: FONT_STACK.ui, fontSize: look.label, fontWeight: 600 },
      emphasis: { disabled: true },
    };
    const valueSeries = {
      type: 'bar' as const,
      barGap: '-100%',
      barCategoryGap: gapPct,
      silent: true,
      z: 3,
      itemStyle: { color: 'transparent' },
      data: rev(rows.map((r, i) => ({ value: offsets[i] + widths[i], label: { color: contrastInk(r.color ?? ctx.palette[0]) }, name: valueText(r) }))),
      label: { show: spec.values !== 'none', position: 'insideRight' as const, distance: 16, formatter: (p: { name: string }) => p.name, fontFamily: FONT_STACK.mono, fontSize: look.value, fontWeight: 600 },
      emphasis: { disabled: true },
    };
    const ghost = spec.options.ghost?.length
      ? (() => {
          const g = spec.options.ghost!;
          const gw = g.map((r) => Math.max(MIN, r.value / top));
          return [
            { ...offsetSeries, stack: 'g', z: 1, data: rev(gw.map((w) => (1 - w) / 2)) },
            { ...offsetSeries, stack: 'g', z: 1, data: rev(gw), itemStyle: { color: look.muted, opacity: 0.35, borderRadius: look.radius } },
          ];
        })()
      : [];
    return {
      ...baseOption(ctx),
      grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
      xAxis: { type: 'value', min: 0, max: 1, show: false },
      yAxis: { type: 'category', data: labels, show: false },
      series: [...ghost, offsetSeries, rowSeries, valueSeries],
    } as ReturnType<PlotDef['build']>;
  },
};
