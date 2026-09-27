import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recognizeImage, _setLoadersForTests, _resetEngineForTests } from '@/ocr/engine';

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
