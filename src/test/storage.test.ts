import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedCharts,
  saveChartToLibrary,
  deleteChartFromLibrary,
  saveAutosave,
  loadAutosave
} from '../lib/storage';
import type { SavedChart } from '../lib/storage';

describe('Storage Library & Autosave (storage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when library has no saved charts', () => {
    expect(getSavedCharts()).toEqual([]);
  });

  it('saves and retrieves a new chart in the library', () => {
    const mockChart: Omit<SavedChart, 'id' | 'updatedAt'> = {
      title: 'Startup Runway',
      subtitle: '18 Months',
      chartType: 'area',
      schemeId: 'emerald',
      aspectRatio: '16:9',
      fontFamily: 'Plus Jakarta Sans',
      bgMode: 'dark',
      showLegend: true,
      showValues: true,
      is3d: false,
      data: [
        { id: '1', name: 'Cash in Bank', value: 1200000 },
        { id: '2', name: 'Burn Rate', value: 65000 }
      ]
    };

    const saved = saveChartToLibrary(mockChart);
    expect(saved.id).toBeDefined();
    expect(saved.updatedAt).toBeTypeOf('number');
    expect(saved.title).toBe('Startup Runway');

    const library = getSavedCharts();
    expect(library).toHaveLength(1);
    expect(library[0].id).toBe(saved.id);
    expect(library[0].data).toEqual(mockChart.data);
  });

  it('updates an existing chart without duplicating it', () => {
    const initialChart = saveChartToLibrary({
      title: 'Original Title',
      subtitle: 'Draft',
      chartType: 'bar',
      schemeId: 'cyber',
      aspectRatio: '1:1',
      fontFamily: 'Plus Jakarta Sans',
      bgMode: 'dark',
      showLegend: true,
      showValues: true,
      is3d: false,
      data: [{ id: '1', name: 'Item', value: 10 }]
    });

    const updated = saveChartToLibrary({
      ...initialChart,
      title: 'Updated Title'
    }, initialChart.id);

    expect(updated.id).toBe(initialChart.id);
    expect(updated.title).toBe('Updated Title');

    const library = getSavedCharts();
    expect(library).toHaveLength(1);
    expect(library[0].title).toBe('Updated Title');
  });

  it('deletes a chart by id from library', () => {
    const chartA = saveChartToLibrary({
      title: 'Chart A',
      subtitle: '',
      chartType: 'bar',
      schemeId: 'cyber',
      aspectRatio: '1:1',
      fontFamily: 'Plus Jakarta Sans',
      bgMode: 'dark',
      showLegend: true,
      showValues: true,
      is3d: false,
      data: []
    });

    const chartB = saveChartToLibrary({
      title: 'Chart B',
      subtitle: '',
      chartType: 'pie',
      schemeId: 'cyber',
      aspectRatio: '1:1',
      fontFamily: 'Plus Jakarta Sans',
      bgMode: 'dark',
      showLegend: true,
      showValues: true,
      is3d: false,
      data: []
    });

    expect(getSavedCharts()).toHaveLength(2);

    const remaining = deleteChartFromLibrary(chartA.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(chartB.id);

    expect(getSavedCharts()).toHaveLength(1);
  });

  it('handles autosave and loads autosaved state', () => {
    expect(loadAutosave()).toBeNull();

    saveAutosave({
      title: 'Autosaved Draft',
      chartType: 'donut',
      schemeId: 'spotify'
    });

    const loaded = loadAutosave();
    expect(loaded).not.toBeNull();
    expect(loaded?.title).toBe('Autosaved Draft');
    expect(loaded?.chartType).toBe('donut');
    expect(loaded?.schemeId).toBe('spotify');
  });

  it('handles corrupted localStorage data without throwing', () => {
    localStorage.setItem('chartgenie_saved_charts_v1', '{invalid_json');
    expect(getSavedCharts()).toEqual([]);

    localStorage.setItem('chartgenie_autosave_v1', 'corrupted_state');
    expect(loadAutosave()).toBeNull();
  });
});
