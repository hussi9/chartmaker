import { describe, it, expect } from 'vitest';
import { CHART_TYPES, defaultSpec, LOOKS, type LookId, type PostSizeId } from '@/chart/types';
import { PLOTS, plotContext } from '@/chart/plots';
import { frame } from '@/chart/frame';
import { metricsMeasurer } from '@/chart/measure';
import { installMeasurer, ssrInstance } from '@/chart/echarts';

const m = metricsMeasurer();
installMeasurer(m);

function render(type: (typeof CHART_TYPES)[number], size: PostSizeId, look: LookId = 'clean'): string {
  const spec = defaultSpec({ type, data: PLOTS[type].sample.map((r) => ({ ...r })), size, look });
  const f = frame(spec, m);
  const ctx = plotContext(spec, f, m);
  const inst = ssrInstance(Math.round(f.plot.w), Math.round(f.plot.h));
  inst.setOption(PLOTS[type].build(ctx));
  const svg = inst.renderToSVGString();
  inst.dispose();
  return svg;
}

describe('every chart type is registered', () => {
  it('has all 19 definitions with metadata', () => {
    for (const t of CHART_TYPES) {
      expect(PLOTS[t], t).toBeDefined();
      expect(PLOTS[t].type).toBe(t);
      expect(PLOTS[t].name.length).toBeGreaterThan(0);
      expect(PLOTS[t].blurb.length).toBeGreaterThan(0);
      expect(PLOTS[t].sample.length).toBeGreaterThan(0);
    }
  });
});

describe.each(CHART_TYPES)('%s', (type) => {
  it('accepts its own sample', () => {
    expect(PLOTS[type].accepts(PLOTS[type].sample)).toEqual({ ok: true });
  });

  it.each(['16:9', '1:1', '9:16'] as const)('renders an SVG with text at %s', (size) => {
    const svg = render(type, size);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('<text');
    expect(svg).toMatch(/<(path|rect|polygon|circle)/);
  });

  it.each(Object.keys(LOOKS) as LookId[])('option is stable in look %s', (look) => {
    const spec = defaultSpec({ type, data: PLOTS[type].sample.map((r) => ({ ...r })), look });
    const option = PLOTS[type].build(plotContext(spec, frame(spec, m), m));
    expect(JSON.parse(JSON.stringify(option, (_k, v) => (typeof v === 'function' ? '[fn]' : v)))).toMatchSnapshot();
  });
});

describe('type-specific rules', () => {
  it('funnel refuses negatives', () => {
    expect(PLOTS.funnel.accepts([{ id: 'a', label: 'a', value: -1 }]).ok).toBe(false);
  });

  it('bar keeps negatives', () => {
    const spec = defaultSpec({ type: 'bar', data: [{ id: 'a', label: 'a', value: 10 }, { id: 'b', label: 'b', value: -5 }] });
    const o = PLOTS.bar.build(plotContext(spec, frame(spec, m), m)) as { series: { data: { value: number }[] }[] };
    expect(o.series[0].data.map((d) => d.value)).toEqual([10, -5]);
  });

  it('kpi shows a delta against the second row', () => {
    const spec = defaultSpec({ type: 'kpi', data: PLOTS.kpi.sample });
    const o = PLOTS.kpi.build(plotContext(spec, frame(spec, m), m));
    expect(JSON.stringify(o.graphic)).toMatch(/delta-(up|down)/);
    expect(JSON.stringify(o.graphic)).toContain('12 pts');
    expect(PLOTS.kpi.accepts([]).ok).toBe(false);
  });

  it('matrix needs x and y on every row', () => {
    expect(PLOTS.matrix.accepts([{ id: 'a', label: 'a', value: 1 }]).ok).toBe(false);
    expect(PLOTS.matrix.accepts(PLOTS.matrix.sample).ok).toBe(true);
    const spec = defaultSpec({ type: 'matrix', data: PLOTS.matrix.sample });
    const o = PLOTS.matrix.build(plotContext(spec, frame(spec, m), m));
    expect(JSON.stringify(o.graphic)).toContain('Quick wins');
  });

  it('stacked types group rows by group', () => {
    const spec = defaultSpec({ type: 'stackedBar', data: PLOTS.stackedBar.sample });
    const o = PLOTS.stackedBar.build(plotContext(spec, frame(spec, m), m)) as { series: { stack?: string; name?: string }[] };
    expect(o.series.length).toBeGreaterThan(1);
    expect(o.series.every((s) => s.stack === 'total')).toBe(true);
  });

  it('funnel draws ghost rows behind when options.ghost is set', () => {
    const spec = defaultSpec({ type: 'funnel', data: PLOTS.funnel.sample, options: { legend: false, grid: true, depth: false, showHandle: false, ghost: PLOTS.funnel.sample } });
    const o = PLOTS.funnel.build(plotContext(spec, frame(spec, m), m)) as { series: unknown[] };
    expect(o.series).toHaveLength(5);
  });

  it('gauge uses the second row as the maximum', () => {
    const spec = defaultSpec({ type: 'gauge', data: [{ id: 'a', label: 'Done', value: 40 }, { id: 'b', label: 'Target', value: 80 }] });
    const o = PLOTS.gauge.build(plotContext(spec, frame(spec, m), m)) as { series: { max: number }[] };
    expect(o.series[0].max).toBe(80);
  });

  it('donut centre shows the total', () => {
    const spec = defaultSpec({ type: 'donut' });
    const o = PLOTS.donut.build(plotContext(spec, frame(spec, m), m));
    expect(JSON.stringify(o.graphic)).toContain('134');
  });
});
