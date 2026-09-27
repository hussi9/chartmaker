import type { ComponentProps, ReactNode, CSSProperties } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ChartCanvas } from '../components/ChartCanvas';
import { COLOR_SCHEMES } from '../lib/chartPresets';
import type { AspectRatio, CanvasThemeMode, ChartType } from '../lib/chartPresets';

// jsdom has no layout. Replace Recharts at its public component boundary so
// every mounted series is observable, including series hidden by ResizeObserver.
vi.mock('recharts', () => {
  const container = ({ children, style }: { children?: ReactNode; style?: CSSProperties }) => <svg style={style}>{children}</svg>;
  const series = ({ isAnimationActive, children }: { isAnimationActive?: boolean; children?: ReactNode }) => (
    <g data-series-animation={String(isAnimationActive)}>{children}</g>
  );
  const empty = () => null;
  return {
    ResponsiveContainer: container,
    PieChart: container, BarChart: container, LineChart: container,
    AreaChart: container, RadarChart: container, ScatterChart: container,
    Pie: series, Bar: series, Line: series, Area: series, Radar: series, Scatter: series,
    Cell: empty, XAxis: empty, YAxis: empty, Tooltip: empty, Legend: empty,
    CartesianGrid: empty, LabelList: empty, PolarGrid: empty,
    PolarAngleAxis: empty, PolarRadiusAxis: empty, ReferenceLine: empty,
  };
});

afterEach(cleanup);

const chartTypes: [ChartType, number][] = [
  ['pie', 1], ['donut', 1], ['bar', 1], ['horizontalBar', 1],
  ['stackedBar', 0], ['stackedColumn', 2], ['stackedHorizontal', 2],
  ['line', 1], ['stackedLine', 2], ['area', 1], ['stackedArea', 2],
  ['radar', 1], ['scatter', 1], ['heatmap', 0], ['threshold', 1],
  ['gauge', 1], ['funnel', 0],
];
const themes: CanvasThemeMode[] = ['dark', 'pure-dark', 'spotify', 'slate', 'light', 'paper'];
const ratios: AspectRatio[] = ['16:9', '1:1', '9:16', '4:3'];

describe('export canvas renders final geometry without waiting for animations', () => {
  it.each(chartTypes)('%s stays settled on mount and after data, theme, depth and ratio edits', (chartType, seriesCount) => {
    const canvasRef = { current: null as HTMLDivElement | null };
    const props: ComponentProps<typeof ChartCanvas> = {
      data: [{ id: 'a', name: 'Alpha', value: 80 }, { id: 'b', name: 'Beta', value: 20 }],
      chartType, scheme: COLOR_SCHEMES[0], title: 'Before edit', subtitle: '',
      showLegend: true, showValues: true, is3d: false, aspectRatio: '16:9',
      fontFamily: 'Inter', bgMode: 'dark', canvasRef,
    };
    const view = render(<ChartCanvas {...props} chartType="line" />);
    view.rerender(<ChartCanvas {...props} />);
    const assertSettled = () => {
      const canvas = canvasRef.current!;
      const series = canvas.querySelectorAll('[data-series-animation]');
      expect(series.length).toBe(seriesCount);
      series.forEach(node => expect(node).toHaveAttribute('data-series-animation', 'false'));
      // CSS transitions also affect html-to-image's live computed-style snapshot.
      [canvas, ...canvas.querySelectorAll<HTMLElement | SVGElement>('[style]')].forEach(node => {
        expect(['', 'none']).toContain(node.style.transition);
        expect(['', 'none']).toContain(node.style.animation);
      });
    };
    assertSettled();
    for (const bgMode of themes) {
      for (const aspectRatio of ratios) {
        view.rerender(<ChartCanvas {...props} bgMode={bgMode} aspectRatio={aspectRatio} is3d
          title={`${bgMode} ${aspectRatio}`}
          data={[{ id: 'a', name: 'Alpha', value: 20 }, { id: 'b', name: 'Beta', value: 80 }]} />);
        expect(canvasRef.current).toHaveTextContent(`${bgMode} ${aspectRatio}`);
        assertSettled();
      }
    }
  });
});
