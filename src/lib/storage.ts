import type { DataItem, ChartType, AspectRatio, FontFamily, CanvasThemeMode } from './chartPresets';

export interface SavedChart {
  id: string;
  title: string;
  subtitle: string;
  chartType: ChartType;
  schemeId: string;
  aspectRatio: AspectRatio;
  fontFamily: FontFamily;
  bgMode: CanvasThemeMode;
  showLegend: boolean;
  showValues: boolean;
  is3d: boolean;
  creatorHandle?: string;
  calloutMetric?: string;
  dataSource?: string;
  showAverageLine?: boolean;
  data: DataItem[];
  updatedAt: number;
}

const STORAGE_KEY_CHARTS = 'chartgenie_saved_charts_v1';
const STORAGE_KEY_AUTOSAVE = 'chartgenie_autosave_v1';

export function getSavedCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHARTS);
    if (!raw) return [];
    return JSON.parse(raw) as SavedChart[];
  } catch (e) {
    console.error('Failed to load saved charts from localStorage', e);
    return [];
  }
}

export function saveChartToLibrary(chart: Omit<SavedChart, 'id' | 'updatedAt'>, existingId?: string): SavedChart {
  const current = getSavedCharts();
  const id = existingId || `chart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const updatedItem: SavedChart = {
    ...chart,
    id,
    updatedAt: Date.now()
  };

  const filtered = current.filter(c => c.id !== id);
  const updatedList = [updatedItem, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY_CHARTS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Failed to save chart to localStorage', e);
  }

  return updatedItem;
}

export function deleteChartFromLibrary(id: string): SavedChart[] {
  const current = getSavedCharts();
  const filtered = current.filter(c => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_CHARTS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete chart from localStorage', e);
  }
  return filtered;
}

export function saveAutosave(payload: Partial<SavedChart>) {
  try {
    localStorage.setItem(STORAGE_KEY_AUTOSAVE, JSON.stringify(payload));
  } catch (e) {
    console.error('Failed to save autosave to localStorage', e);
  }
}

export function loadAutosave(): Partial<SavedChart> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTOSAVE);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<SavedChart>;
  } catch (e) {
    console.error('Failed to load autosave from localStorage', e);
    return null;
  }
}

export function exportBackupJson(): string {
  const charts = getSavedCharts();
  const autosave = loadAutosave();
  return JSON.stringify({ charts, autosave, version: 1, exportedAt: Date.now() }, null, 2);
}

export function importBackupJson(jsonStr: string): { success: boolean; count: number } {
  try {
    const data = JSON.parse(jsonStr);
    if (data.charts && Array.isArray(data.charts)) {
      localStorage.setItem(STORAGE_KEY_CHARTS, JSON.stringify(data.charts));
      return { success: true, count: data.charts.length };
    }
    return { success: false, count: 0 };
  } catch (e) {
    console.error('Failed to import backup JSON', e);
    return { success: false, count: 0 };
  }
}
