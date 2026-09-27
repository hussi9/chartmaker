import { describe, it, expect } from 'vitest';
import { CHART_TYPES, POST_SIZES, LOOKS, PALETTES, defaultSpec, SAMPLE_ROWS } from '@/chart/types';

describe('chart spec constants', () => {
  it('has 19 chart types, 4 sizes, 4 looks, 6 palettes', () => {
    expect(CHART_TYPES).toHaveLength(19);
    expect(Object.keys(POST_SIZES)).toEqual(['16:9', '1:1', '9:16', '4:3']);
    expect(POST_SIZES['9:16']).toMatchObject({ w: 1080, h: 1920 });
    expect(POST_SIZES['16:9']).toMatchObject({ w: 1600, h: 900 });
    expect(Object.keys(LOOKS)).toEqual(['clean', 'bold', 'dark', 'newsletter']);
    expect(PALETTES).toHaveLength(6);
    expect(PALETTES[0].colors).toEqual(['#0e9384', '#1e293b', '#e0a33a', '#e26d5a']);
  });

  it('includes the two new types', () => {
    expect(CHART_TYPES).toContain('kpi');
    expect(CHART_TYPES).toContain('matrix');
  });

  it('defaultSpec is a valid clean 16:9 bar with the sample rows', () => {
    const s = defaultSpec();
    expect(s).toMatchObject({ v: 2, type: 'bar', size: '16:9', look: 'clean', values: 'number+pct', callouts: [] });
    expect(s.data).toHaveLength(4);
    expect(s.data).toEqual(SAMPLE_ROWS);
    expect(s.palette).toEqual(PALETTES[0].colors);
    expect(s.options).toMatchObject({ legend: false, grid: true, depth: false, showHandle: false });
  });

  it('defaultSpec merges a partial without sharing the sample array', () => {
    const s = defaultSpec({ type: 'donut', text: { title: 'Mix' } });
    expect(s.type).toBe('donut');
    expect(s.text.title).toBe('Mix');
    expect(s.data).not.toBe(SAMPLE_ROWS);
  });

  it('looks carry the tokens the frame and plots need', () => {
    expect(LOOKS.clean).toMatchObject({ bg: '#ffffff', ink: '#1e293b', radius: 6, title: 30 });
    expect(LOOKS.dark.bg).toBe('#1e293b');
    expect(LOOKS.newsletter.border).toBe('#1e293b');
    expect(LOOKS.bold.title).toBeGreaterThan(LOOKS.clean.title);
  });
});
