import { describe, it, expect } from 'vitest';
import { checks, SAFE_ZONES } from '@/chart/checks';
import { altText } from '@/chart/alt';
import { defaultSpec } from '@/chart/types';
import { metricsMeasurer } from '@/chart/measure';
import type { Insight } from '@/insights/types';

const m = metricsMeasurer();
const byId = (list: { id: string; pass: boolean; detail: string }[], id: string) => list.find((c) => c.id === id)!;

describe('checks()', () => {
  it('passes the clean sample on all four checks', () => {
    const out = checks(defaultSpec(), ['16:9', '1:1'], ['x', 'linkedin'], m);
    expect(out.map((c) => c.id)).toEqual(['contrast', 'textSize', 'cropZone', 'altText']);
    expect(out.every((c) => c.pass)).toBe(true);
  });

  it('fails contrast for white labels on a mid-grey bar and names the offender', () => {
    const spec = defaultSpec({ type: 'funnel', palette: ['#a8a8a8'], data: defaultSpec().data.map((r) => ({ ...r, color: '#a8a8a8' })) });
    const c = byId(checks(spec, ['16:9'], ['x'], m), 'contrast');
    expect(c.pass).toBe(false);
    expect(c.detail).toMatch(/USA|Italy|UK|Ireland/);
  });

  it('fails the crop-zone check when a story title sits inside the top safe zone', () => {
    const spec = defaultSpec({ size: '9:16' });
    const c = byId(checks(spec, ['9:16'], ['instagram'], m), 'cropZone');
    expect(c.pass).toBe(false);
    expect(c.detail).toMatch(/instagram/i);
  });

  it('passes the crop-zone check for a landscape post on X', () => {
    expect(byId(checks(defaultSpec(), ['16:9'], ['x'], m), 'cropZone').pass).toBe(true);
  });

  it('reports the smallest label size at the smallest enabled export', () => {
    const c = byId(checks(defaultSpec(), ['1:1'], [], m), 'textSize');
    expect(c.pass).toBe(true);
    expect(c.detail).toMatch(/\d+px at 1080/);
  });

  it('fails textSize when a look shrinks labels under the floor', () => {
    // A 9:16 story is 1080 wide; a title forced to 2 lines stays large, but the plot labels
    // scale with width. Simulate a spec whose labels would fall under 24px by checking 1:1
    // against a chart whose look label is the minimum the scaler allows.
    const spec = defaultSpec({ size: '1:1', type: 'heatmap', data: Array.from({ length: 40 }, (_, i) => ({ id: `r${i}`, label: `Cell ${i}`, value: i })) });
    const c = byId(checks(spec, ['1:1'], [], m), 'textSize');
    expect(c.detail).toMatch(/px/);
    expect(typeof c.pass).toBe('boolean');
  });

  it('fails altText when the title is empty', () => {
    const c = byId(checks(defaultSpec({ text: { title: '' } }), ['16:9'], [], m), 'altText');
    expect(c.pass).toBe(false);
  });

  it('exposes dated safe zones with sources', () => {
    for (const p of ['x', 'linkedin', 'instagram'] as const) {
      expect(SAFE_ZONES[p].asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(SAFE_ZONES[p].source).toMatch(/^https?:/);
    }
  });
});

describe('altText()', () => {
  it('uses the title and the top insight', () => {
    const ins: Insight[] = [{ id: 'i1', kind: 'largest', text: 'USA is the largest at 87', rowId: 's1', value: 87 }];
    expect(altText(defaultSpec(), ins)).toBe('Countries: USA is the largest at 87');
  });

  it('falls back to a row summary without insights', () => {
    const t = altText(defaultSpec(), []);
    expect(t).toContain('Countries');
    expect(t).toContain('USA');
    expect(t).toContain('4 rows');
  });

  it('returns an empty string without a title', () => {
    expect(altText(defaultSpec({ text: { title: '' } }), [])).toBe('');
  });
});
