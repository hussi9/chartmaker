import { describe, it, expect } from 'vitest';
import { PLOTS, plotContext } from '@/chart/plots';
import { baseOption, itemStyle, ruleLine, ghostSeries } from '@/chart/plots/common';
import { frame } from '@/chart/frame';
import { defaultSpec, CHART_TYPES, type Row } from '@/chart/types';
import { metricsMeasurer } from '@/chart/measure';

const m = metricsMeasurer();
const rows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, label: `Row ${i}`, value: i + 1 }));

describe('plot registry', () => {
  it('registers bar with a sample, a category and a builder', () => {
    expect(PLOTS.bar.type).toBe('bar');
    expect(PLOTS.bar.sample.length).toBeGreaterThan(0);
    expect(['bars', 'trends', 'compare', 'kpis', 'funnels', 'matrix']).toContain(PLOTS.bar.category);
    expect(typeof PLOTS.bar.build).toBe('function');
    expect(PLOTS.bar.accepts([]).ok).toBe(false);
  });

  it('only registers known chart types', () => {
    for (const k of Object.keys(PLOTS)) expect(CHART_TYPES).toContain(k);
  });
});

describe('plotContext', () => {
  it('caps rows at 60 and reports how many were cut', () => {
    const spec = defaultSpec({ data: rows(121) });
    const ctx = plotContext(spec, frame(spec, m), m);
    expect(ctx.rows).toHaveLength(60);
    expect(ctx.capped).toBe(61);
  });

  it('cycles the palette and honours a row colour', () => {
    const spec = defaultSpec({ data: [...rows(5), { id: 'c', label: 'Custom', value: 1, color: '#123456' }] });
    const ctx = plotContext(spec, frame(spec, m), m);
    expect(ctx.rows[0].color).toBe(spec.palette[0]);
    expect(ctx.rows[4].color).toBe(spec.palette[0]);
    expect(ctx.rows[5].color).toBe('#123456');
  });

  it('sums the total and formats through the values mode', () => {
    const spec = defaultSpec();
    const ctx = plotContext(spec, frame(spec, m), m);
    expect(ctx.total).toBe(134);
    expect(ctx.fmt(87)).toBe('87 · 65%');
    expect(plotContext({ ...spec, values: 'number' }, frame(spec, m), m).fmt(87)).toBe('87');
  });
});

describe('common option fragments', () => {
  const spec = defaultSpec();
  const ctx = plotContext(spec, frame(spec, m), m);

  it('baseOption disables animation and has no tooltip', () => {
    const o = baseOption(ctx);
    expect(o.animation).toBe(false);
    expect(o).not.toHaveProperty('tooltip');
    expect(o.backgroundColor).toBe('transparent');
  });

  it('legend only when enabled', () => {
    expect(baseOption(ctx).legend).toBeUndefined();
    const on = plotContext({ ...spec, options: { ...spec.options, legend: true } }, frame(spec, m), m);
    expect(baseOption(on).legend).toBeDefined();
  });

  it('itemStyle is flat by default and adds depth when asked', () => {
    expect(itemStyle('#0e9384', ctx)).toMatchObject({ color: '#0e9384', borderRadius: 6 });
    const deep = plotContext({ ...spec, options: { ...spec.options, depth: true } }, frame(spec, m), m);
    const s = itemStyle('#0e9384', deep) as { shadowBlur?: number; color: unknown };
    expect(s.shadowBlur).toBeGreaterThan(0);
    expect(typeof s.color).toBe('object');
  });

  it('ruleLine labels the average', () => {
    const avg = plotContext({ ...spec, options: { ...spec.options, rule: { kind: 'avg' } } }, frame(spec, m), m);
    const ml = ruleLine(avg) as { data: { yAxis?: number; label: { formatter: string } }[] };
    expect(ml.data[0].label.formatter).toBe('avg 33.5');
    expect(ruleLine(ctx)).toBeUndefined();
  });

  it('ghostSeries returns a faded copy when ghost rows exist', () => {
    const ghost = plotContext({ ...spec, options: { ...spec.options, ghost: rows(4) } }, frame(spec, m), m);
    const g = ghostSeries(ghost, { type: 'bar' }) as { itemStyle: { opacity: number }; silent: boolean } | null;
    expect(g?.itemStyle.opacity).toBeCloseTo(0.35);
    expect(g?.silent).toBe(true);
    expect(ghostSeries(ctx, { type: 'bar' })).toBeNull();
  });
});
