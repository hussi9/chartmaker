import type { DataItem, ChartType } from './chartPresets';

export interface ChartStatePayload {
  title: string;
  subtitle: string;
  chartType: ChartType;
  schemeId: string;
  data: DataItem[];
  dataSource?: string;
  showAverageLine?: boolean;
}

// Encode state to Base64 hash
export const encodeChartState = (payload: ChartStatePayload): string => {
  try {
    const jsonStr = JSON.stringify(payload);
    return btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error('Failed to encode chart state to URL hash', e);
    return '';
  }
};

// Decode state from Base64 hash
export const decodeChartState = (hash: string): ChartStatePayload | null => {
  try {
    if (!hash || hash.length < 5) return null;
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const jsonStr = decodeURIComponent(atob(cleanHash));
    return JSON.parse(jsonStr) as ChartStatePayload;
  } catch (e) {
    console.error('Failed to decode chart state from URL hash', e);
    return null;
  }
};
