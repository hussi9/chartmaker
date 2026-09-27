import type { PlotDef } from './types';
import { FONT_STACK } from '../echarts';
import { baseOption, categoryAxis, valueAxis, labelStyle, needRows, mix } from './common';
import type { Row } from '../types';

export const scatter: PlotDef = {
  type: 'scatter',
  name: 'Scatter',
  category: 'matrix',
  blurb: 'Points by value; add x and y columns for a real plot.',
  sample: [
    { id: 'sc1', label: 'A', value: 12, x: 1, y: 12 }, { id: 'sc2', label: 'B', value: 20, x: 2, y: 20 },
    { id: 'sc3', label: 'C', value: 16, x: 3, y: 16 }, { id: 'sc4', label: 'D', value: 28, x: 4, y: 28 },
    { id: 'sc5', label: 'E', value: 24, x: 5, y: 24 },
  ],
  accepts: (rows) => needRows(rows, 2, 'A scatter plot'),
  build(ctx) {
    const { rows, spec } = ctx;
    const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
    const hasXY = rows.every((r) => typeof r.x === 'number');
    return {
      ...baseOption(ctx),
      xAxis: hasXY ? { ...valueAxis(ctx), splitLine: { show: false } } : categoryAxis(ctx, rows.map((r) => r.label)),
      yAxis: valueAxis(ctx),
      series: [{
        type: 'scatter',
        data: rows.map((r, i) => ({ name: r.label, value: hasXY ? [r.x as number, r.y ?? r.value] : [i, r.value], itemStyle: { color: r.color ?? ctx.palette[0], opacity: 0.9 } })),
        symbolSize: (v: number[]) => 10 + (Math.abs(v[1]) / max) * 26,
        label: { show: spec.values !== 'none', position: 'top', formatter: (p: { name: string }) => p.name, ...labelStyle(ctx, false), fontFamily: FONT_STACK.ui },
        labelLayout: { hideOverlap: true },
      }],
    } as ReturnType<PlotDef['build']>;
  },
};

const DEFAULT_QUADRANTS: [string, string, string, string] = ['Quick wins', 'Big bets', 'Fill-ins', 'Money pits'];

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export const matrix: PlotDef = {
  type: 'matrix',
  name: 'Priority Matrix',
  category: 'matrix',
  blurb: '2×2: effort across, impact up. Bubble size is the value.',
  sample: [
    { id: 'm1', label: 'Onboarding', value: 40, x: 2, y: 8 }, { id: 'm2', label: 'Billing v2', value: 60, x: 8, y: 9 },
    { id: 'm3', label: 'Dark mode', value: 15, x: 3, y: 3 }, { id: 'm4', label: 'Data export', value: 30, x: 7, y: 2 },
    { id: 'm5', label: 'Search', value: 25, x: 6, y: 6 },
  ],
  accepts: (rows: Row[]) => {
    const base = needRows(rows, 1, 'A matrix');
    if (!base.ok) return base;
    return rows.every((r) => typeof r.x === 'number' && typeof r.y === 'number') ? { ok: true } : { ok: false, reason: 'A matrix needs an x and a y on every row' };
  },
  build(ctx) {
    const { rows, look, spec } = ctx;
    const xs = rows.map((r) => r.x as number);
    const ys = rows.map((r) => r.y as number);
    const mx = median(xs);
    const my = median(ys);
    const maxV = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
    const q = spec.options.quadrants ?? DEFAULT_QUADRANTS;
    const qStyle = { fontFamily: FONT_STACK.ui, fontSize: look.label, fill: look.muted, fontWeight: 600 };
    const pad = 8;
    return {
      ...baseOption(ctx),
      grid: { left: pad, right: pad, top: pad, bottom: pad, containLabel: false },
      xAxis: { type: 'value', min: 0, max: Math.max(10, ...xs) * 1.05, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: { type: 'value', min: 0, max: Math.max(10, ...ys) * 1.05, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
      graphic: [
        { type: 'text', left: pad + 6, top: pad + 4, style: { text: q[0], ...qStyle } },
        { type: 'text', right: pad + 6, top: pad + 4, style: { text: q[1], ...qStyle, align: 'right' } },
        { type: 'text', left: pad + 6, bottom: pad + 4, style: { text: q[2], ...qStyle } },
        { type: 'text', right: pad + 6, bottom: pad + 4, style: { text: q[3], ...qStyle, align: 'right' } },
      ],
      series: [{
        type: 'scatter',
        data: rows.map((r) => ({ name: r.label, value: [r.x, r.y, r.value], itemStyle: { color: r.color ?? ctx.palette[0], opacity: 0.85 } })),
        symbolSize: (v: number[]) => 14 + (Math.abs(v[2]) / maxV) * 40,
        label: { show: true, position: 'top', formatter: (p: { name: string }) => p.name, ...labelStyle(ctx, false), fontFamily: FONT_STACK.ui },
        labelLayout: { hideOverlap: true },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: look.grid, width: 2 },
          label: { show: false },
          data: [{ xAxis: mx }, { yAxis: my }],
        },
      }],
    } as ReturnType<PlotDef['build']>;
  },
};

export const radar: PlotDef = {
  type: 'radar',
  name: 'Radar',
  category: 'compare',
  blurb: 'Several dimensions of one thing on a polygon.',
  sample: [
    { id: 'ra1', label: 'Speed', value: 80 }, { id: 'ra2', label: 'Quality', value: 65 }, { id: 'ra3', label: 'Cost', value: 40 },
    { id: 'ra4', label: 'Support', value: 72 }, { id: 'ra5', label: 'Docs', value: 55 },
  ],
  accepts: (rows) => needRows(rows, 3, 'A radar'),
  build(ctx) {
    const { rows, look } = ctx;
    const max = Math.max(1, ...rows.map((r) => r.value));
    const color = rows[0]?.color ?? ctx.palette[0];
    return {
      ...baseOption(ctx),
      grid: undefined,
      radar: {
        indicator: rows.map((r) => ({ name: r.label, max })),
        radius: '68%',
        center: ['50%', '52%'],
        splitNumber: 5,
        axisName: { color: look.ink, fontFamily: FONT_STACK.ui, fontSize: look.label },
        splitLine: { lineStyle: { color: look.grid } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: look.grid } },
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 7,
        data: [{ value: rows.map((r) => r.value), name: ctx.spec.text.title, itemStyle: { color }, lineStyle: { color, width: 3 }, areaStyle: { color, opacity: 0.18 }, label: { show: false } }],
      }],
    } as ReturnType<PlotDef['build']>;
  },
};

export const heatmap: PlotDef = {
  type: 'heatmap',
  name: 'Heat Grid',
  category: 'matrix',
  blurb: 'Every value as a tile, darker means more.',
  sample: [
    { id: 'hm1', label: 'Mon', value: 12 }, { id: 'hm2', label: 'Tue', value: 30 }, { id: 'hm3', label: 'Wed', value: 22 },
    { id: 'hm4', label: 'Thu', value: 45 }, { id: 'hm5', label: 'Fri', value: 38 }, { id: 'hm6', label: 'Sat', value: 8 },
  ],
  accepts: (rows) => needRows(rows, 1, 'A heat grid'),
  build(ctx) {
    const { rows, look, spec } = ctx;
    const cols = Math.ceil(Math.sqrt(rows.length));
    const rowsN = Math.ceil(rows.length / cols);
    const base = rows[0]?.color ?? ctx.palette[0];
    const values = rows.map((r) => r.value);
    return {
      ...baseOption(ctx),
      grid: { left: 0, right: 0, top: 0, bottom: 0, containLabel: false },
      xAxis: { type: 'category', data: Array.from({ length: cols }, (_, i) => String(i)), show: false },
      yAxis: { type: 'category', data: Array.from({ length: rowsN }, (_, i) => String(i)), show: false, inverse: true },
      visualMap: { show: false, min: Math.min(...values), max: Math.max(...values), inRange: { color: [mix(base, look.bg, 0.85), base] } },
      series: [{
        type: 'heatmap',
        data: rows.map((r, i) => ({ name: r.label, value: [i % cols, Math.floor(i / cols), r.value] })),
        itemStyle: { borderColor: look.bg, borderWidth: 6, borderRadius: look.radius },
        label: {
          show: true,
          formatter: (p: { name: string; value: number[] }) => spec.values === 'none' ? p.name : `${p.name}\n${ctx.fmt(p.value[2])}`,
          fontFamily: FONT_STACK.ui,
          fontSize: look.label,
          fontWeight: 600,
          color: look.ink,
          lineHeight: look.label + 4,
        },
      }],
    } as ReturnType<PlotDef['build']>;
  },
};
