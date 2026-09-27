import { describe, it, expect, vi, afterEach } from 'vitest';
import { captionFrom } from '@/caption/templates';
import { hasBuiltinModel, tryBuiltinModel } from '@/caption/builtin';
import { insights } from '@/insights';
import { defaultSpec } from '@/chart/types';

const spec = defaultSpec();
const ins = insights(spec.data);

describe('captionFrom()', () => {
  it('plain', () => {
    expect(captionFrom(spec, ins, 'plain')).toBe('Countries: USA leads at 87, 65% of the total.');
  });

  it('punchy', () => {
    expect(captionFrom(spec, ins, 'punchy')).toBe('One value carries it: USA at 87 is 4.4× the next, and 65% of everything. Where next?');
  });

  it('analyst', () => {
    expect(captionFrom(spec, ins, 'analyst')).toBe('USA accounts for 65% of the 134 total; the next largest, Italy, trails at 4.4× less.');
  });

  it('never contains "undefined" and copes with one row', () => {
    const one = defaultSpec({ data: [{ id: 'a', label: 'Retention', value: 87, unit: 'percent' }], text: { title: 'Retention' } });
    for (const tone of ['plain', 'punchy', 'analyst'] as const) {
      const c = captionFrom(one, insights(one.data), tone);
      expect(c).not.toMatch(/undefined|NaN/);
      expect(c.length).toBeGreaterThan(10);
    }
  });

  it('uses the title when there are no rows', () => {
    const empty = defaultSpec({ data: [] });
    expect(captionFrom(empty, [], 'plain')).toBe('Countries.');
  });
});

describe('built-in model hook', () => {
  afterEach(() => { delete (globalThis as { LanguageModel?: unknown }).LanguageModel; });

  it('reports absence and resolves null without a model', async () => {
    expect(hasBuiltinModel()).toBe(false);
    await expect(tryBuiltinModel('hi', 50)).resolves.toBeNull();
  });

  it('returns the model text when available', async () => {
    (globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue({ prompt: vi.fn().mockResolvedValue('  Stub caption  '), destroy: vi.fn() }),
    };
    expect(hasBuiltinModel()).toBe(true);
    await expect(tryBuiltinModel('hi', 500)).resolves.toBe('Stub caption');
  });

  it('gives up after the timeout', async () => {
    (globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue({ prompt: () => new Promise((r) => setTimeout(() => r('late'), 200)), destroy: vi.fn() }),
    };
    await expect(tryBuiltinModel('hi', 20)).resolves.toBeNull();
  });
});
