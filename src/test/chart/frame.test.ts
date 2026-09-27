import { describe, it, expect } from 'vitest';
import { frame } from '@/chart/frame';
import { defaultSpec, POST_SIZES } from '@/chart/types';
import { metricsMeasurer } from '@/chart/measure';

const m = metricsMeasurer();

describe('frame()', () => {
  it('pads by 2.75% of the width and keeps the plot inside the padding', () => {
    const f = frame(defaultSpec(), m);
    expect(f.w).toBe(1600);
    expect(f.h).toBe(900);
    expect(f.pad).toBe(44);
    expect(f.plot.x).toBe(44);
    expect(f.plot.x + f.plot.w).toBe(1600 - 44);
    expect(f.plot.y).toBeGreaterThan(44);
    expect(f.plot.y + f.plot.h).toBeLessThan(900 - 44);
  });

  it('places the title above the plot and the footer below it', () => {
    const f = frame(defaultSpec(), m);
    expect(f.title).toHaveLength(1);
    expect(f.title![0].text).toBe('Countries');
    expect(f.title![0].y + f.title![0].h).toBeLessThanOrEqual(f.plot.y);
    expect(f.site.text).toBe('chartgenie.xyz');
    expect(f.site.anchor).toBe('end');
    expect(f.site.x + f.site.w).toBeCloseTo(1600 - 44, 5);
    expect(f.site.y).toBeGreaterThanOrEqual(f.plot.y + f.plot.h);
  });

  it('omits the badge unless showHandle and a handle are set', () => {
    expect(frame(defaultSpec(), m).badge).toBeUndefined();
    const withHandle = defaultSpec({ options: { legend: false, grid: true, depth: false, showHandle: true, handle: 'me' } });
    const f = frame(withHandle, m);
    expect(f.badge?.text).toBe('@me');
    expect(f.badge!.pill.x + f.badge!.pill.w).toBeLessThanOrEqual(1600 - 44);
  });

  it('wraps a long title to two lines and truncates a very long one', () => {
    const long = defaultSpec({ text: { title: 'Quarterly revenue by region compared with the same quarter last year, the year before that, and the five-year average for context' } });
    const f = frame(long, m);
    expect(f.title).toHaveLength(2);
    const huge = defaultSpec({ text: { title: 'word '.repeat(60).trim() } });
    const g = frame(huge, m);
    expect(g.title).toHaveLength(2);
    expect(g.title![1].text.endsWith('…')).toBe(true);
  });

  it('shows subtitle and source when present', () => {
    const f = frame(defaultSpec({ text: { title: 'T', subtitle: 'Stage-by-stage drop-off', source: 'Statista' } }), m);
    expect(f.subtitle?.text).toBe('Stage-by-stage drop-off');
    expect(f.source?.text).toBe('Source: Statista');
  });

  it('adds a remix line above the footer when remixedFrom is set', () => {
    const f = frame(defaultSpec({ options: { legend: false, grid: true, depth: false, showHandle: false, remixedFrom: 'ada' } }), m);
    expect(f.remix?.text).toBe('remixed from @ada');
    expect(f.remix!.y).toBeLessThan(f.site.y);
    expect(f.remix!.y).toBeGreaterThanOrEqual(f.plot.y + f.plot.h);
  });

  it('scales title size with the post width and clamps at 24px', () => {
    const wide = frame(defaultSpec({ size: '16:9' }), m).title![0].size;
    const square = frame(defaultSpec({ size: '1:1' }), m).title![0].size;
    expect(wide).toBe(60);
    expect(square).toBeGreaterThanOrEqual(24);
    expect(square).toBeLessThan(wide);
  });

  it('makes a taller-than-wide plot at 9:16', () => {
    const f = frame(defaultSpec({ size: '9:16' }), m);
    expect(f.w).toBe(POST_SIZES['9:16'].w);
    expect(f.plot.h).toBeGreaterThan(f.plot.w);
  });
});
