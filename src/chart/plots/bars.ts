import type { PlotDef, PlotCtx } from './types';
import { baseOption, categoryAxis, valueAxis, itemStyle, labelStyle, ruleLine, ghostSeries, needRows } from './common';
import { grouped, normalise, STACKED_SAMPLE } from './grouped';

export const horizontalBar: PlotDef = {
  type: 'horizontalBar',
  name: 'Ranked Bars',
  category: 'bars',
  blurb: 'Top-N, longest bar first. Easy to read at 1:1.',
  sample: [
    { id: 'h1', label: 'Engineering', value: 45 },
    { id: 'h2', label: 'Marketing', value: 25 },
    { id: 'h3', label: 'Sales', value: 15 },
    { id: 'h4', label: 'Operations', value: 10 },
    { id: 'h5', label: 'Success', value: 5 },
  ],
  accepts: (rows) => needRows(rows, 1, 'Ranked bars'),
  build(ctx) {
    const { rows, look, spec } = ctx;
    const ordered = [...rows].reverse();
    const series = {
      type: 'bar' as const,
      barCategoryGap: `${Math.round(look.barGap * 100)}%`,
      data: ordered.map((r) => ({ value: r.value, itemStyle: itemStyle(r.color ?? ctx.palette[0], ctx) })),
      label: { show: spec.values !== 'none', position: 'right' as const, formatter: (p: { value: number }) => ctx.fmt(p.value), ...labelStyle(ctx, false) },
      labelLayout: { hideOverlap: true },
      markLine: ruleLine(ctx, true),
    };
    const ghost = ghostSeries(ctx, { type: 'bar', barGap: '-100%', barCategoryGap: series.barCategoryGap });
    if (ghost) ghost.data = [...(spec.options.ghost ?? [])].reverse().map((r) => r.value);
    return {
      ...baseOption(ctx),
      grid: { left: 0, right: Math.round(ctx.plot.w * 0.12), top: 4, bottom: spec.options.legend ? look.label + 20 : 0, containLabel: true },
      xAxis: valueAxis(ctx, true),
      yAxis: categoryAxis(ctx, ordered.map((r) => r.label), true),
      series: ghost ? [ghost, series] : [series],
    } as ReturnType<PlotDef['build']>;
  },
};

function stackedOption(ctx: PlotCtx, horizontal: boolean, percent: boolean): ReturnType<PlotDef['build']> {
  const { look, spec } = ctx;
  const g0 = grouped(ctx.rows, ctx.palette);
  const g = percent ? normalise(g0) : g0;
  const series = g.series.map((s) => ({
    type: 'bar' as const,
    name: s.name,
    stack: 'total',
    barCategoryGap: `${Math.round(look.barGap * 100)}%`,
    data: s.values,
    itemStyle: itemStyle(s.color, ctx),
    label: {
      show: spec.values !== 'none',
      position: 'inside' as const,
      formatter: (p: { value: number | null }) => (p.value == null ? '' : percent ? `${p.value}%` : ctx.fmt(p.value)),
      ...labelStyle(ctx, true, s.color),
    },
    labelLayout: { hideOverlap: true },
  }));
  const withLegend = { ...spec, options: { ...spec.options, legend: true } };
  const base = baseOption({ ...ctx, spec: withLegend });
  const cat = categoryAxis(ctx, g.categories, horizontal);
  const val = { ...valueAxis(ctx, horizontal), ...(percent ? { max: 100 } : {}) };
  return {
    ...base,
    xAxis: horizontal ? val : cat,
    yAxis: horizontal ? cat : val,
    series,
  } as ReturnType<PlotDef['build']>;
}

export const stackedBar: PlotDef = {
  type: 'stackedBar',
  name: 'Stacked Bars',
  category: 'compare',
  blurb: 'Parts of each column, stacked by group.',
  sample: STACKED_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A stacked chart'),
  build: (ctx) => stackedOption(ctx, false, false),
};

export const stackedColumn: PlotDef = {
  type: 'stackedColumn',
  name: '100% Stacked',
  category: 'compare',
  blurb: 'Each column normalised to 100%, so mix is comparable.',
  sample: STACKED_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A stacked chart'),
  build: (ctx) => stackedOption(ctx, false, true),
};

export const stackedHorizontal: PlotDef = {
  type: 'stackedHorizontal',
  name: 'Stacked Horizontal',
  category: 'compare',
  blurb: 'Stacked bars laid on their side, long labels welcome.',
  sample: STACKED_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A stacked chart'),
  build: (ctx) => stackedOption(ctx, true, false),
};

export const threshold: PlotDef = {
  type: 'threshold',
  name: 'Rule Chart',
  category: 'bars',
  blurb: 'Bars against an average or a target line.',
  sample: [
    { id: 'r1', label: 'Mon', value: 42 }, { id: 'r2', label: 'Tue', value: 51 }, { id: 'r3', label: 'Wed', value: 38 },
    { id: 'r4', label: 'Thu', value: 60 }, { id: 'r5', label: 'Fri', value: 47 },
  ],
  accepts: (rows) => needRows(rows, 2, 'A rule chart'),
  build(ctx) {
    const ruled: PlotCtx = { ...ctx, spec: { ...ctx.spec, options: { ...ctx.spec.options, rule: ctx.spec.options.rule ?? { kind: 'avg' } } } };
    const { rows, look, spec } = ruled;
    const rule = ruled.spec.options.rule!;
    const threshold = rule.kind === 'avg' ? rows.reduce((a, r) => a + r.value, 0) / Math.max(1, rows.length) : rule.value;
    return {
      ...baseOption(ruled),
      xAxis: categoryAxis(ruled, rows.map((r) => r.label)),
      yAxis: valueAxis(ruled),
      series: [{
        type: 'bar',
        barCategoryGap: `${Math.round(look.barGap * 100)}%`,
        data: rows.map((r) => ({ value: r.value, itemStyle: itemStyle(r.value >= threshold ? (r.color ?? ctx.palette[0]) : look.muted, ruled) })),
        label: { show: spec.values !== 'none', position: 'top', formatter: (p: { value: number }) => ctx.fmt(p.value), ...labelStyle(ruled, false) },
        labelLayout: { hideOverlap: true },
        markLine: ruleLine(ruled),
      }],
    } as ReturnType<PlotDef['build']>;
  },
};
