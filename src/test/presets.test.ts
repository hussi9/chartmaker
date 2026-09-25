import { describe, it, expect } from 'vitest';
import { COLOR_SCHEMES, SAMPLE_DATASETS } from '../lib/chartPresets';

describe('Chart Presets & Color Schemes (chartPresets)', () => {
  it('contains viral themes including spotify, apple, bloomberg, notion, and cyber', () => {
    const schemeIds = COLOR_SCHEMES.map(s => s.id);
    expect(schemeIds).toContain('spotify');
    expect(schemeIds).toContain('apple');
    expect(schemeIds).toContain('bloomberg');
    expect(schemeIds).toContain('notion');
    expect(schemeIds).toContain('cyber');
    expect(schemeIds).toContain('sunset');
    expect(schemeIds).toContain('emerald');
  });

  it('each color scheme provides at least 5 distinct hex color values', () => {
    COLOR_SCHEMES.forEach(scheme => {
      expect(scheme.colors.length).toBeGreaterThanOrEqual(5);
      scheme.colors.forEach(color => {
        expect(color).toMatch(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
      });
    });
  });

  it('contains viral meme presets in SAMPLE_DATASETS with valid data and titles', () => {
    const datasetKeys = Object.keys(SAMPLE_DATASETS);
    expect(datasetKeys).toContain('memeCoding');
    expect(datasetKeys).toContain('memeSalary');
    expect(datasetKeys).toContain('memeMeeting');
    expect(datasetKeys).toContain('aiMarket');

    Object.entries(SAMPLE_DATASETS).forEach(([_key, dataset]) => {
      expect(dataset.title).toBeTruthy();
      expect(dataset.data.length).toBeGreaterThanOrEqual(2);
      dataset.data.forEach(item => {
        expect(item.name).toBeTruthy();
        expect(typeof item.value).toBe('number');
        expect(item.value).toBeGreaterThan(0);
      });
    });
  });
});
