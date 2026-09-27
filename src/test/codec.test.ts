import { describe, it, expect } from 'vitest';
import { encodeState, decodeState, decodeLegacyHash, shareUrls, MAX_PATH_STATE, ChartSpecSchema } from '@/codec/state';
import { defaultSpec, type Row } from '@/chart/types';

// The exact encoder the live product used for share links (src/lib/urlState.ts at baseline-2026-09-27).
function legacyEncode(payload: object): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

describe('encodeState / decodeState', () => {
  it('round-trips a spec', () => {
    const spec = defaultSpec({ text: { title: 'Countries', subtitle: 'x', source: 'y' }, callouts: [{ id: 'c', insightId: 'i', text: 't', anchor: { rowId: 's1' } }] });
    const s = encodeState(spec);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeState(s)).toEqual(spec);
  });

  it('is shorter than the raw JSON for a real chart', () => {
    const spec = defaultSpec();
    expect(encodeState(spec).length).toBeLessThan(JSON.stringify(spec).length);
  });

  it('returns null for tampered or garbage input', () => {
    const s = encodeState(defaultSpec());
    // corrupt the middle of the deflate stream (the trailer alone is not authenticated by inflate)
    expect(decodeState(s.slice(0, 20) + 'zzzz' + s.slice(24))).toBeNull();
    expect(decodeState('not-a-state')).toBeNull();
    expect(decodeState('')).toBeNull();
  });

  it('rejects a payload that is valid gzip but not a chart', () => {
    const spec = { ...defaultSpec(), type: 'pyramid' } as unknown as Parameters<typeof encodeState>[0];
    expect(decodeState(encodeState(spec))).toBeNull();
  });

  it('caps rows and strings through the schema', () => {
    const many: Row[] = Array.from({ length: 2000 }, (_, i) => ({ id: `r${i}`, label: `Row ${i}`, value: i }));
    expect(ChartSpecSchema.safeParse(defaultSpec({ data: many })).success).toBe(false);
    expect(ChartSpecSchema.safeParse(defaultSpec({ text: { title: 'x'.repeat(500) } })).success).toBe(false);
  });
});

describe('shareUrls', () => {
  it('gives a path link and a hash link for a normal chart', () => {
    const u = shareUrls(defaultSpec(), 'https://chartgenie.xyz');
    expect(u.path).toMatch(/^https:\/\/chartgenie\.xyz\/s\/[A-Za-z0-9_-]+$/);
    expect(u.hash).toMatch(/^https:\/\/chartgenie\.xyz\/s#[A-Za-z0-9_-]+$/);
  });

  it('omits the path link when the state is too long for a URL', () => {
    const rows: Row[] = Array.from({ length: 300 }, (_, i) => ({ id: `row-${i}-${Math.random()}`, label: `A fairly long label number ${i} ${Math.random()}`, value: Math.random() * 1e6 }));
    const u = shareUrls(defaultSpec({ data: rows }), 'https://chartgenie.xyz');
    expect(encodeState(defaultSpec({ data: rows })).length).toBeGreaterThan(MAX_PATH_STATE);
    expect(u.path).toBeUndefined();
    expect(u.hash).toContain('/s#');
  });
});

describe('decodeLegacyHash', () => {
  const legacy = {
    title: 'Countries',
    subtitle: 'Sample',
    chartType: 'funnel',
    schemeId: 'cyber',
    data: [{ id: '1', name: 'USA', value: 87 }, { id: '2', name: 'Italy', value: 20, color: '#ff0000' }],
    dataSource: 'Statista',
    showAverageLine: true,
  };

  it('converts a v1 hash into a v2 spec with the same title, rows and a mapped palette', () => {
    const spec = decodeLegacyHash('#' + legacyEncode(legacy));
    expect(spec).not.toBeNull();
    expect(spec!.v).toBe(2);
    expect(spec!.type).toBe('funnel');
    expect(spec!.text).toEqual({ title: 'Countries', subtitle: 'Sample', source: 'Statista' });
    expect(spec!.data.map((r) => r.label)).toEqual(['USA', 'Italy']);
    expect(spec!.data[1].color).toBe('#ff0000');
    expect(spec!.options.rule).toEqual({ kind: 'avg' });
    expect(spec!.palette).toEqual(['#4f9dd9', '#7c3aed', '#ec4899', '#f59e0b']);
    expect(spec!.look).toBe('clean');
  });

  it('accepts the hash with or without the leading #', () => {
    expect(decodeLegacyHash(legacyEncode(legacy))?.text.title).toBe('Countries');
  });

  it('drops an unknown chart type back to bar and ignores junk', () => {
    expect(decodeLegacyHash('#' + legacyEncode({ ...legacy, chartType: 'nope' }))?.type).toBe('bar');
    expect(decodeLegacyHash('#zzz')).toBeNull();
    expect(decodeLegacyHash('')).toBeNull();
  });

  it('a v2 state is not mistaken for a legacy hash', () => {
    expect(decodeLegacyHash(encodeState(defaultSpec()))).toBeNull();
  });
});
