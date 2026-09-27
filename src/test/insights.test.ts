import { describe, it, expect } from 'vitest';
import { insights } from '@/insights';
import { suggest } from '@/insights/suggest';
import { SAMPLE_ROWS, type Row } from '@/chart/types';

const row = (label: string, value: number, extra: Partial<Row> = {}): Row => ({ id: label.toLowerCase(), label, value, ...extra });

describe('insights()', () => {
  it('finds the design’s four facts for the sample', () => {
    const texts = insights(SAMPLE_ROWS).map((i) => i.text);
    expect(texts).toContain('USA is 4.4× the next value');
    expect(texts).toContain('USA holds 65% of the total');
    expect(texts).toContain('UK is the smallest at 12');
    expect(texts).toContain('Average is 33.5');
  });

  it('anchors largest and smallest to their rows and caps at six', () => {
    const out = insights(SAMPLE_ROWS);
    expect(out.find((i) => i.kind === 'largest')?.rowId).toBe('s1');
    expect(out.find((i) => i.kind === 'smallest')?.rowId).toBe('s3');
    expect(out.length).toBeLessThanOrEqual(6);
    expect(new Set(out.map((i) => i.id)).size).toBe(out.length);
  });

  it('has no ratio for a single row and nothing for no rows', () => {
    expect(insights([row('Only', 5)]).some((i) => i.kind === 'ratio')).toBe(false);
    expect(insights([])).toEqual([]);
  });

  it('reports first→last delta and trend for date-like labels', () => {
    const out = insights([row('Jan', 12), row('Feb', 15), row('Mar', 14), row('Apr', 22)]);
    expect(out.find((i) => i.kind === 'delta')?.text).toBe('Up 83% from Jan to Apr');
    expect(out.find((i) => i.kind === 'trend')?.text).toBe('Rising over 4 periods');
  });

  it('notes when parts sum to 100', () => {
    const out = insights([row('A', 60, { unit: 'percent' }), row('B', 40, { unit: 'percent' })]);
    expect(out.find((i) => i.kind === 'sum100')?.text).toBe('Parts add up to 100%');
  });

  it('formats units', () => {
    const out = insights([row('Q1', 1200, { unit: 'currency' }), row('Q2', 3400, { unit: 'currency' })]);
    expect(out.find((i) => i.kind === 'largest')?.text).toBe('Q2 is the largest at $3.4k');
  });
});

describe('suggest()', () => {
  it('returns nothing for no rows and exactly three otherwise', () => {
    expect(suggest([])).toEqual([]);
    expect(suggest([row('Only', 5)])).toHaveLength(3);
    expect(suggest(SAMPLE_ROWS)).toHaveLength(3);
  });

  it('one row → kpi first', () => {
    expect(suggest([row('Retention', 87)])[0].type).toBe('kpi');
  });

  it('two rows → bar as before/after', () => {
    const s = suggest([row('2023', 12), row('2024', 34)]);
    expect(s[0].type).toBe('bar');
    expect(s[0].reason).toMatch(/before/i);
  });

  it('dates → line first', () => {
    expect(suggest([row('Jan', 1), row('Feb', 2), row('Mar', 3)])[0].type).toBe('line');
    expect(suggest([row('2021', 1), row('2022', 2), row('2023', 3)])[0].type).toBe('line');
    expect(suggest([row('Q1 2026', 1), row('Q2 2026', 2), row('Q3 2026', 3)])[0].type).toBe('line');
  });

  it('parts of 100 → donut first', () => {
    expect(suggest([row('Mobile', 62), row('Desktop', 30), row('Tablet', 8)])[0].type).toBe('donut');
  });

  it('monotonic decreasing list of 3+ → funnel first', () => {
    const s = suggest([row('Visited', 1200), row('Signed up', 480), row('Paid', 64)]);
    expect(s[0].type).toBe('funnel');
    expect(s[0].reason).toMatch(/drop|decreas/i);
  });

  it('rows with x and y → matrix first', () => {
    expect(suggest([row('A', 1, { x: 1, y: 2 }), row('B', 2, { x: 3, y: 4 })])[0].type).toBe('matrix');
  });

  it('the sample (ranked, one dominant) → funnel, then ranked bars, then donut', () => {
    expect(suggest(SAMPLE_ROWS).map((s) => s.type)).toEqual(['funnel', 'horizontalBar', 'donut']);
  });

  it('never suggests the same type twice', () => {
    for (const rows of [SAMPLE_ROWS, [row('Only', 5)], [row('a', 1), row('b', 2)]]) {
      const types = suggest(rows).map((s) => s.type);
      expect(new Set(types).size).toBe(types.length);
    }
  });
});
