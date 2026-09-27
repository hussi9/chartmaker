import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recognizeImage, ensureEngine, _setLoadersForTests, _resetEngineForTests } from '@/ocr/engine';

// Ruling (Task 2): ppu-paddle-ocr's own README/types confirm it already picks
// WebGPU-with-automatic-WASM-fallback internally ("no code changes... silently
// falls back to WASM if WebGPU is unavailable or fails") — the app does not
// need its own navigator.gpu branch. tesseract.js stays as a genuine
// last-resort fallback only if the primary engine itself fails to load.
beforeEach(() => {
  _resetEngineForTests();
});

describe('recognizeImage engine selection', () => {
  const fakeFile = new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' });

  it('uses the primary (PaddleOCR) loader by default', async () => {
    const primary = vi.fn().mockResolvedValue(vi.fn().mockResolvedValue(['USA 87', 'Italy 20']));
    const fallback = vi.fn();
    _setLoadersForTests({ primary, fallback });
    const lines = await recognizeImage(fakeFile);
    expect(lines).toEqual(['USA 87', 'Italy 20']);
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back to tesseract.js if the primary loader throws', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('model failed to load'));
    const fallback = vi.fn().mockResolvedValue(vi.fn().mockResolvedValue(['fallback line']));
    _setLoadersForTests({ primary, fallback });
    const lines = await recognizeImage(fakeFile);
    expect(lines).toEqual(['fallback line']);
  });

  it('caches the chosen engine across calls (loader runs once)', async () => {
    const recognizer = vi.fn().mockResolvedValue(['a']);
    const primary = vi.fn().mockResolvedValue(recognizer);
    _setLoadersForTests({ primary, fallback: vi.fn() });
    await recognizeImage(fakeFile);
    await recognizeImage(fakeFile);
    expect(primary).toHaveBeenCalledTimes(1);
    expect(recognizer).toHaveBeenCalledTimes(2);
  });

  it('if both the primary and the fallback throw, the rejection propagates (caller shows the read-failed warning)', async () => {
    _setLoadersForTests({ primary: vi.fn().mockRejectedValue(new Error('a')), fallback: vi.fn().mockRejectedValue(new Error('b')) });
    await expect(recognizeImage(fakeFile)).rejects.toThrow();
  });
});

// Review item I1: recognizeImage previously cached only the *resolved*
// engine, not the in-flight load — two pictures picked before the first
// model download finished each started their own download (a real OOM risk
// on a phone). ensureEngine() is the fix under test here; recognizeImage
// uses it internally, so this also covers the original call site.
describe('ensureEngine deduplicates concurrent loads (review item I1)', () => {
  const fakeFile = new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' });

  it('two overlapping calls before the loader resolves invoke the primary loader only once', async () => {
    let resolvePrimary!: (r: ReturnType<typeof vi.fn>) => void;
    const recognizer = vi.fn().mockResolvedValue(['a']);
    const primary = vi.fn().mockReturnValue(new Promise((r) => { resolvePrimary = r; }));
    _setLoadersForTests({ primary, fallback: vi.fn() });

    const first = ensureEngine();
    const second = ensureEngine();
    resolvePrimary(recognizer);
    const [a, b] = await Promise.all([first, second]);

    expect(primary).toHaveBeenCalledTimes(1);
    expect(a).toBe(recognizer);
    expect(b).toBe(recognizer);
  });

  it('a failed load can be retried on the next call, not stuck rejecting forever', async () => {
    const recognizer = vi.fn().mockResolvedValue(['a']);
    _setLoadersForTests({
      primary: vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(recognizer),
      fallback: vi.fn().mockRejectedValueOnce(new Error('network')),
    });
    await expect(ensureEngine()).rejects.toThrow();
    await expect(ensureEngine()).resolves.toBe(recognizer);
  });

  it('recognizeImage still works through ensureEngine for two overlapping picks (integration)', async () => {
    let resolvePrimary!: (r: ReturnType<typeof vi.fn>) => void;
    const recognizer = vi.fn().mockResolvedValue(['line']);
    const primary = vi.fn().mockReturnValue(new Promise((r) => { resolvePrimary = r; }));
    _setLoadersForTests({ primary, fallback: vi.fn() });

    const first = recognizeImage(fakeFile);
    const second = recognizeImage(fakeFile);
    resolvePrimary(recognizer);
    await Promise.all([first, second]);

    expect(primary).toHaveBeenCalledTimes(1);
  });
});
