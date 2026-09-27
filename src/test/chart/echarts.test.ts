import { describe, it, expect } from 'vitest';
import { ssrInstance, installMeasurer, FONT_STACK } from '@/chart/echarts';
import { metricsMeasurer } from '@/chart/measure';

describe('ECharts registration', () => {
  it('renders an SVG string headlessly', () => {
    const inst = ssrInstance(800, 450);
    inst.setOption({ animation: false, xAxis: { type: 'category', data: ['USA', 'Italy'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [87, 20] }] });
    const svg = inst.renderToSVGString();
    inst.dispose();
    expect(svg.startsWith('<svg width="800"')).toBe(true);
    expect(svg).toContain('<text');
  });

  it('registers funnel, gauge, radar, heatmap, scatter, pie, line', () => {
    const inst = ssrInstance(400, 300);
    for (const type of ['funnel', 'pie', 'line', 'scatter'] as const) {
      inst.setOption({ animation: false, ...(type === 'line' || type === 'scatter' ? { xAxis: { type: 'category', data: ['a', 'b'] }, yAxis: {} } : {}), series: [{ type, data: [{ name: 'a', value: 1 }, { name: 'b', value: 2 }] }] }, true);
      expect(inst.renderToSVGString()).toMatch(/<(path|rect|polygon|circle)/);
    }
    inst.setOption({ animation: false, series: [{ type: 'gauge', data: [{ value: 40 }] }] }, true);
    expect(inst.renderToSVGString()).toMatch(/<(path|rect|polygon|circle)/);
    inst.setOption({ animation: false, radar: { indicator: [{ name: 'a', max: 5 }, { name: 'b', max: 5 }, { name: 'c', max: 5 }] }, series: [{ type: 'radar', data: [{ value: [1, 2, 3] }] }] }, true);
    expect(inst.renderToSVGString()).toMatch(/<(path|rect|polygon|circle)/);
    inst.setOption({ animation: false, xAxis: { type: 'category', data: ['a'] }, yAxis: { type: 'category', data: ['b'] }, visualMap: { show: false, min: 0, max: 1 }, series: [{ type: 'heatmap', data: [[0, 0, 1]] }] }, true);
    expect(inst.renderToSVGString()).toMatch(/<(path|rect|polygon|circle)/);
    inst.dispose();
  });

  it('uses our measurer for text width once installed', () => {
    const calls: string[] = [];
    const base = metricsMeasurer();
    installMeasurer({ width: (t, s, r, w) => { calls.push(t); return base.width(t, s, r, w); } });
    const inst = ssrInstance(800, 450);
    inst.setOption({ animation: false, xAxis: { type: 'category', data: ['Ireland', 'Italy'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [15, 20] }] });
    inst.renderToSVGString();
    inst.dispose();
    expect(calls).toContain('Ireland');
    installMeasurer(base);
  });

  it('exposes the three font stacks', () => {
    expect(FONT_STACK.display).toMatch(/Bricolage/);
    expect(FONT_STACK.ui).toMatch(/Geist Variable/);
    expect(FONT_STACK.mono).toMatch(/Geist Mono/);
  });
});
