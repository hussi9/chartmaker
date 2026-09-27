import type { PlotDef, PlotCtx } from './types';
import { FONT_STACK } from '../echarts';
import { formatNumber } from '../format';
import { baseOption, itemStyle, needRows, nonNegative } from './common';

const SHARE_SAMPLE = [
  { id: 'p1', label: 'Mobile', value: 62 },
  { id: 'p2', label: 'Desktop', value: 30 },
  { id: 'p3', label: 'Tablet', value: 8 },
];

function pieOption(ctx: PlotCtx, donut: boolean): ReturnType<PlotDef['build']> {
  const { rows, look, spec } = ctx;
  const radius = donut ? ['48%', '72%'] : ['0%', '70%'];
  const series = {
    type: 'pie' as const,
    radius,
    center: ['50%', '50%'],
    minShowLabelAngle: 8,
    padAngle: donut ? 2 : 0,
    data: rows.map((r) => ({ name: r.label, value: r.value, itemStyle: { ...itemStyle(r.color ?? ctx.palette[0], ctx), borderColor: look.bg, borderWidth: 2, borderRadius: donut ? look.radius : 0 } })),
    label: {
      show: spec.values !== 'none',
      position: 'outside' as const,
      formatter: (p: { name: string; value: number }) => `${p.name}\n${ctx.fmt(p.value)}`,
      lineHeight: look.label + 4,
      color: look.ink,
      fontFamily: FONT_STACK.ui,
      fontSize: look.label,
    },
    labelLine: { length: 12, length2: 16, lineStyle: { color: look.line } },
    labelLayout: { hideOverlap: true },
  };
  const graphic = donut
    ? [
        { type: 'text', left: 'center', top: '44%', style: { text: formatNumber(ctx.total, ctx.unit), fontFamily: FONT_STACK.display, fontSize: Math.round(look.title * 1.1), fontWeight: 800, fill: look.ink, align: 'center' } },
        { type: 'text', left: 'center', top: '56%', style: { text: 'total', fontFamily: FONT_STACK.ui, fontSize: look.label, fill: look.muted, align: 'center' } },
      ]
    : undefined;
  return { ...baseOption(ctx), grid: undefined, series: [series], ...(graphic ? { graphic } : {}) } as ReturnType<PlotDef['build']>;
}

export const pie: PlotDef = {
  type: 'pie',
  name: 'Pie',
  category: 'compare',
  blurb: 'Slices of a whole. Best with five or fewer parts.',
  sample: SHARE_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A pie') .ok ? nonNegative(rows, 'A pie') : needRows(rows, 2, 'A pie'),
  build: (ctx) => pieOption(ctx, false),
};

export const donut: PlotDef = {
  type: 'donut',
  name: 'Donut Share',
  category: 'compare',
  blurb: 'Parts of a whole with the total in the middle.',
  sample: SHARE_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A donut').ok ? nonNegative(rows, 'A donut') : needRows(rows, 2, 'A donut'),
  build: (ctx) => pieOption(ctx, true),
};

export const gauge: PlotDef = {
  type: 'gauge',
  name: 'Gauge / Meter',
  category: 'kpis',
  blurb: 'One value against a target. Second row sets the maximum.',
  sample: [
    { id: 'ga1', label: 'Progress', value: 68 },
    { id: 'ga2', label: 'Target', value: 100 },
  ],
  accepts: (rows) => needRows(rows, 1, 'A gauge').ok ? nonNegative(rows, 'A gauge') : needRows(rows, 1, 'A gauge'),
  build(ctx) {
    const { rows, look } = ctx;
    const value = rows[0].value;
    const max = rows[1]?.value && rows[1].value > 0 ? rows[1].value : Math.max(100, value);
    const color = rows[0].color ?? ctx.palette[0];
    return {
      ...baseOption(ctx),
      grid: undefined,
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max,
        center: ['50%', '62%'],
        radius: '95%',
        progress: { show: true, width: Math.max(16, Math.round(ctx.plot.h * 0.09)), roundCap: true, itemStyle: { color } },
        axisLine: { lineStyle: { width: Math.max(16, Math.round(ctx.plot.h * 0.09)), color: [[1, look.grid]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: true, offsetCenter: [0, '24%'], color: look.muted, fontFamily: FONT_STACK.ui, fontSize: look.label },
        detail: {
          valueAnimation: false,
          offsetCenter: [0, '-6%'],
          formatter: () => formatNumber(value, ctx.unit),
          color: look.ink,
          fontFamily: FONT_STACK.display,
          fontSize: Math.round(look.title * 1.6),
          fontWeight: 800,
        },
        data: [{ value, name: rows[0].label }],
      }],
    } as ReturnType<PlotDef['build']>;
  },
};

