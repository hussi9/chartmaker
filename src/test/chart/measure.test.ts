import { describe, it, expect } from 'vitest';
import { metricsMeasurer, canvasMeasurer, defaultMeasurer } from '@/chart/measure';

describe('metricsMeasurer (shipped advance-width tables)', () => {
  const m = metricsMeasurer();

  it('measures a short UI word at a plausible width', () => {
    const w = m.width('USA', 15, 'ui');
    expect(w).toBeGreaterThan(24);
    expect(w).toBeLessThan(36);
  });

  it('returns 0 for empty text', () => {
    expect(m.width('', 15, 'ui')).toBe(0);
  });

  it('scales linearly with size', () => {
    const a = m.width('Ireland', 10, 'ui');
    const b = m.width('Ireland', 20, 'ui');
    expect(b / a).toBeCloseTo(2, 5);
  });

  it('falls back to the average advance for unknown glyphs', () => {
    const known = m.width('a', 16, 'ui');
    const unknown = m.width('中', 16, 'ui');
    expect(unknown).toBeGreaterThan(0);
    expect(Math.abs(unknown - known)).toBeLessThan(16);
  });

  it('display and mono roles differ from ui', () => {
    const t = 'Countries 87';
    expect(m.width(t, 16, 'display', 800)).not.toBe(m.width(t, 16, 'ui'));
    expect(m.width(t, 16, 'mono')).not.toBe(m.width(t, 16, 'ui'));
  });

  it('heavier weight is at least as wide', () => {
    expect(m.width('Countries', 30, 'display', 800)).toBeGreaterThanOrEqual(m.width('Countries', 30, 'display', 400));
  });
});

describe('measurer selection', () => {
  it('canvasMeasurer degrades to metrics when 2D canvas is unavailable', () => {
    // jsdom has no 2D context; the canvas measurer must still return a number.
    const w = canvasMeasurer().width('USA', 15, 'ui');
    expect(w).toBeGreaterThan(0);
  });

  it('defaultMeasurer returns a measurer in any environment', () => {
    expect(defaultMeasurer().width('x', 12, 'ui')).toBeGreaterThan(0);
  });
});
