import { describe, it, expect } from 'vitest';
import { encodeChartState, decodeChartState } from '../lib/urlState';
import type { ChartStatePayload } from '../lib/urlState';

describe('URL Hash State Encoder & Decoder', () => {
  it('encodes and decodes chart state accurately in a roundtrip', () => {
    const original: ChartStatePayload = {
      title: 'Global OS Share',
      subtitle: '2026 Survey',
      chartType: 'donut',
      schemeId: 'spotify',
      data: [
        { id: '1', name: 'Android', value: 71.4 },
        { id: '2', name: 'iOS', value: 28.6 }
      ]
    };

    const encoded = encodeChartState(original);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');

    const decoded = decodeChartState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.title).toBe(original.title);
    expect(decoded?.subtitle).toBe(original.subtitle);
    expect(decoded?.chartType).toBe(original.chartType);
    expect(decoded?.schemeId).toBe(original.schemeId);
    expect(decoded?.data).toEqual(original.data);
  });

  it('handles invalid or empty hash gracefully', () => {
    expect(decodeChartState('')).toBeNull();
    expect(decodeChartState('xyz')).toBeNull();
    expect(decodeChartState('invalid_base64_json!@#')).toBeNull();
  });
});
