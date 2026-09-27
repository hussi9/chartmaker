import type { PlotDef } from './types';
import { baseOption, categoryAxis, valueAxis, itemStyle, labelStyle, ruleLine, ghostSeries, needRows } from './common';

export const bar: PlotDef = {
  type: 'bar',
  name: 'Bars',
  category: 'bars',
  blurb: 'Compare a handful of values side by side.',
  sample: [
    { id: 'b1', label: 'Organic', value: 52 },
    { id: 'b2', label: 'Direct', value: 24 },
    { id: 'b3', label: 'Social', value: 18 },
    { id: 'b4', label: 'Referral', value: 9 },
  ],
  accepts: (rows) => needRows(rows, 1, 'A bar chart'),
  build(ctx) {
    const { rows, look, spec } = ctx;
    const series = {
      type: 'bar' as const,
      barCategoryGap: `${Math.round(look.barGap * 100)}%`,
      data: rows.map((r) => ({ value: r.value, itemStyle: itemStyle(r.color ?? ctx.palette[0], ctx) })),
      label: { show: spec.values !== 'none', position: 'top' as const, formatter: (p: { value: number }) => ctx.fmt(p.value), ...labelStyle(ctx, false) },
      labelLayout: { hideOverlap: true },
      markLine: ruleLine(ctx),
    };
    const ghost = ghostSeries(ctx, { type: 'bar', barGap: '-100%', barCategoryGap: series.barCategoryGap });
    return {
      ...baseOption(ctx),
      xAxis: categoryAxis(ctx, rows.map((r) => r.label)),
      yAxis: valueAxis(ctx),
      series: ghost ? [ghost, series] : [series],
    } as ReturnType<PlotDef['build']>;
  },
};
