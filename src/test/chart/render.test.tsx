import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { defaultSpec } from '@/chart/types';
import { frame } from '@/chart/frame';
import { metricsMeasurer } from '@/chart/measure';
import { plotSvg } from '@/chart/render/plotSvg';
import { textBoxes } from '@/chart/render/parse';
import { placeCallouts } from '@/chart/render/callouts';
import { svgString } from '@/chart/render/svgString';
import '@/chart/render/fonts.node';

const m = metricsMeasurer();

// Headless instances (first arg null) stay real; DOM-mounted instances are faked in jsdom.
vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null
      ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest)
      : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

describe('plotSvg', () => {
  it('returns the inner nodes of an ECharts SVG sized to the plot box', () => {
    const spec = defaultSpec();
    const f = frame(spec, m);
    const inner = plotSvg(spec, f, m);
    expect(inner.startsWith('<svg')).toBe(false);
    expect(inner).toContain('<text');
    expect(inner).toMatch(/<(path|rect)/);
  });
});

describe('textBoxes', () => {
  it('parses text nodes into frame-space boxes with positive widths', () => {
    const spec = defaultSpec();
    const f = frame(spec, m);
    const boxes = textBoxes(plotSvg(spec, f, m), f.plot, m);
    expect(boxes.length).toBeGreaterThan(3);
    const usa = boxes.find((b) => b.text === 'USA');
    expect(usa).toBeDefined();
    expect(usa!.w).toBeGreaterThan(0);
    expect(usa!.x).toBeGreaterThanOrEqual(f.plot.x);
    expect(usa!.y).toBeGreaterThanOrEqual(f.plot.y);
    expect(usa!.fill).toMatch(/^#|^rgb/);
  });
});

describe('svgString', () => {
  it('composes a full SVG with frame text, plot labels and the site footer', () => {
    const spec = defaultSpec({ text: { title: 'Countries', subtitle: 'Sample rows', source: 'internal' } });
    const svg = svgString(spec, { measure: m });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('viewBox="0 0 1600 900"');
    expect(svg).toContain('>Countries<');
    expect(svg).toContain('chartgenie.xyz');
    expect(svg).toContain('Source: internal');
    for (const l of ['USA', 'Italy', 'UK', 'Ireland']) expect(svg).toContain(l);
    expect(svg.match(/<svg/g)).toHaveLength(1);
  });

  it('embeds three font faces when asked', () => {
    const svg = svgString(defaultSpec(), { measure: m, embedFonts: true });
    expect(svg.match(/@font-face/g)).toHaveLength(3);
    expect(svg).toContain('data:font/woff2;base64,');
  });

  it('draws the dark look background and the newsletter border', () => {
    expect(svgString(defaultSpec({ look: 'dark' }), { measure: m })).toContain('fill="#1e293b"');
    expect(svgString(defaultSpec({ look: 'newsletter' }), { measure: m })).toMatch(/stroke="#1e293b"/);
  });

  it('renders callouts anchored to a row label and inside the frame', () => {
    const spec = defaultSpec({ callouts: [{ id: 'c1', insightId: 'ratio', text: 'USA is 4.4× Italy', anchor: { rowId: 's1' } }] });
    const svg = svgString(spec, { measure: m });
    expect(svg).toContain('id="callout-c1"');
    expect(svg).toContain('USA is 4.4× Italy');
  });
});

describe('placeCallouts', () => {
  it('places the pill to the right of the anchor and flips near the edge', () => {
    const spec = defaultSpec({ callouts: [{ id: 'c1', insightId: 'x', text: 'Ireland is small', anchor: { rowId: 's4' } }] });
    const f = frame(spec, m);
    const boxes = textBoxes(plotSvg(spec, f, m), f.plot, m);
    const [c] = placeCallouts(spec, f, boxes, m);
    expect(c.id).toBe('c1');
    expect(c.box.x).toBeGreaterThanOrEqual(f.pad);
    expect(c.box.x + c.box.w).toBeLessThanOrEqual(f.w - f.pad);
    expect(c.box.y).toBeGreaterThanOrEqual(f.plot.y - 4);
  });

  it('drops a callout whose row is gone', () => {
    const spec = defaultSpec({ callouts: [{ id: 'c1', insightId: 'x', text: 'gone', anchor: { rowId: 'nope' } }] });
    const f = frame(spec, m);
    expect(placeCallouts(spec, f, textBoxes(plotSvg(spec, f, m), f.plot, m), m)).toEqual([]);
  });
});

describe('<Chart/>', () => {
  it('mounts the frame svg and a plot host', async () => {
    const { Chart } = await import('@/chart/render/Chart');
    const { container } = render(<Chart spec={defaultSpec()} />);
    expect(container.querySelector('svg.cg-frame')).not.toBeNull();
    expect(container.querySelector('.cg-plot')).not.toBeNull();
    expect(container.textContent).toContain('Countries');
  });
});
