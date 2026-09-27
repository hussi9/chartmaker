import { describe, it, expect, vi } from 'vitest';
import { detectImage } from '@/insights/detectImage';

vi.mock('@/ocr/engine', () => ({ recognizeImage: vi.fn() }));

describe('detectImage', () => {
  const fakeFile = new File([new Uint8Array([1])], 'x.png', { type: 'image/png' });

  it('joins recognized lines and runs them through the ordinary detect() pipeline', async () => {
    const { recognizeImage } = await import('@/ocr/engine');
    vi.mocked(recognizeImage).mockResolvedValue(['Country Revenue', 'USA 87', 'Italy 20']);
    const d = await detectImage(fakeFile);
    expect(d.kind).toBe('image');
    expect(d.rows.map((r) => [r.label, r.value])).toEqual([['USA', 87], ['Italy', 20]]);
  });

  it('returns an empty detection, never throws, when nothing is recognized (Review Focus 1)', async () => {
    const { recognizeImage } = await import('@/ocr/engine');
    vi.mocked(recognizeImage).mockResolvedValue([]);
    const d = await detectImage(fakeFile);
    expect(d.kind).toBe('image');
    expect(d.rows).toEqual([]);
    expect(d.warnings.length).toBeGreaterThan(0);
  });

  it('returns an empty detection when the engine itself throws', async () => {
    const { recognizeImage } = await import('@/ocr/engine');
    vi.mocked(recognizeImage).mockRejectedValue(new Error('model failed to load'));
    const d = await detectImage(fakeFile);
    expect(d.rows).toEqual([]);
    expect(d.warnings[0]).toMatch(/couldn.t read|try again/i);
  });
});
