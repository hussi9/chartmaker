import type { PlotDef, PlotCtx } from './types';
import { baseOption, categoryAxis, valueAxis, labelStyle, ruleLine, ghostSeries, needRows } from './common';
import { grouped, STACKED_SAMPLE, TREND_SAMPLE } from './grouped';

function lineSeries(ctx: PlotCtx, name: string, color: string, values: (number | null)[], area: boolean, stack: boolean): Record<string, unknown> {
  const { spec } = ctx;
  return {
    type: 'line',
    name,
    smooth: 0.3,
    symbol: 'circle',
    symbolSize: 8,
    showSymbol: true,
    data: values,
    ...(stack ? { stack: 'total' } : {}),
    lineStyle: { color, width: 3 },
    itemStyle: { color, borderColor: ctx.look.bg, borderWidth: 2 },
    ...(area ? { areaStyle: { color, opacity: stack ? 0.55 : 0.18 } } : {}),
    endLabel: { show: spec.values !== 'none', formatter: (p: { value: number | null }) => (p.value == null ? '' : ctx.fmt(p.value)), offset: [6, 0], ...labelStyle(ctx, false) },
    label: { show: false },
    labelLayout: { hideOverlap: true },
  };
}

function trendOption(ctx: PlotCtx, area: boolean, stack: boolean): ReturnType<PlotDef['build']> {
  const { rows, spec } = ctx;
  const hasGroups = rows.some((r) => r.group);
  const rightPad = Math.round(ctx.plot.w * 0.12);
  if (!hasGroups) {
    const color = rows[0]?.color ?? ctx.palette[0];
    const series = { ...lineSeries(ctx, spec.text.title, color, rows.map((r) => r.value), area, false), markLine: ruleLine(ctx) };
    const ghost = ghostSeries(ctx, { type: 'line', smooth: 0.3, symbol: 'none', endLabel: { show: false } });
    return {
      ...baseOption(ctx),
      grid: { left: 0, right: rightPad, top: 8, bottom: 0, containLabel: true },
      xAxis: { ...categoryAxis(ctx, rows.map((r) => r.label)), boundaryGap: false },
      yAxis: valueAxis(ctx),
      series: ghost ? [ghost, series] : [series],
    } as ReturnType<PlotDef['build']>;
  }
  const g = grouped(rows, ctx.palette);
  const withLegend = { ...spec, options: { ...spec.options, legend: true } };
  const base = baseOption({ ...ctx, spec: withLegend });
  return {
    ...base,
    grid: { ...(base.grid as object), right: rightPad },
    xAxis: { ...categoryAxis(ctx, g.categories), boundaryGap: false },
    yAxis: valueAxis(ctx),
    series: g.series.map((s) => lineSeries(ctx, s.name, s.color, s.values, area, stack)),
  } as ReturnType<PlotDef['build']>;
}

export const line: PlotDef = {
  type: 'line',
  name: 'Growth Line',
  category: 'trends',
  blurb: 'A value over time, end label on the last point.',
  sample: TREND_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A line chart'),
  build: (ctx) => trendOption(ctx, false, false),
};

export const area: PlotDef = {
  type: 'area',
  name: 'Area',
  category: 'trends',
  blurb: 'A line with the space beneath it filled.',
  sample: TREND_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'An area chart'),
  build: (ctx) => trendOption(ctx, true, false),
};

export const stackedLine: PlotDef = {
  type: 'stackedLine',
  name: 'Stacked Lines',
  category: 'trends',
  blurb: 'Several series over time, one line each, stacked.',
  sample: STACKED_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A stacked line chart'),
  build: (ctx) => trendOption(ctx, false, true),
};

export const stackedArea: PlotDef = {
  type: 'stackedArea',
  name: 'Stacked Area',
  category: 'trends',
  blurb: 'How the mix of series changes over time.',
  sample: STACKED_SAMPLE,
  accepts: (rows) => needRows(rows, 2, 'A stacked area chart'),
  build: (ctx) => trendOption(ctx, true, true),
};
