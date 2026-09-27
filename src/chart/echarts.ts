// The ONLY module that imports from 'echarts/*'. Everything the app draws
// goes through this registration so the bundle stays tree-shaken and the
// server renders with exactly the same components.
import * as echarts from 'echarts/core';
import {
  BarChart, LineChart, PieChart, FunnelChart, GaugeChart, RadarChart, ScatterChart, HeatmapChart,
} from 'echarts/charts';
import {
  GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, GraphicComponent,
  VisualMapComponent, DatasetComponent, PolarComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { ComposeOption } from 'echarts/core';
import type {
  BarSeriesOption, LineSeriesOption, PieSeriesOption, FunnelSeriesOption, GaugeSeriesOption,
  RadarSeriesOption, ScatterSeriesOption, HeatmapSeriesOption,
} from 'echarts/charts';
import type {
  GridComponentOption, LegendComponentOption, MarkLineComponentOption, MarkPointComponentOption,
  GraphicComponentOption, VisualMapComponentOption, DatasetComponentOption, RadarComponentOption, PolarComponentOption,
} from 'echarts/components';
import { FONT_FAMILY, type FontRole, type TextMeasurer } from './measure';

echarts.use([
  BarChart, LineChart, PieChart, FunnelChart, GaugeChart, RadarChart, ScatterChart, HeatmapChart,
  GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, GraphicComponent,
  VisualMapComponent, DatasetComponent, PolarComponent,
  SVGRenderer,
]);

export { echarts };

export type EChartsOption = ComposeOption<
  | BarSeriesOption | LineSeriesOption | PieSeriesOption | FunnelSeriesOption | GaugeSeriesOption
  | RadarSeriesOption | ScatterSeriesOption | HeatmapSeriesOption
  | GridComponentOption | LegendComponentOption | MarkLineComponentOption | MarkPointComponentOption
  | GraphicComponentOption | VisualMapComponentOption | DatasetComponentOption | RadarComponentOption | PolarComponentOption
>;

export const FONT_STACK: Record<FontRole, string> = FONT_FAMILY;

// Parse the CSS shorthand ECharts hands to measureText: "[weight] [size]px family".
function parseFont(font: string | undefined): { size: number; role: FontRole; weight: number } {
  const f = font ?? '';
  const size = Number(/(\d+(?:\.\d+)?)px/.exec(f)?.[1] ?? 12);
  const wm = /(?:^|\s)(\d{3}|bold|bolder|normal)(?=\s)/.exec(f)?.[1];
  const weight = wm === 'bold' || wm === 'bolder' ? 700 : wm === 'normal' ? 400 : wm ? Number(wm) : 400;
  const role: FontRole = /Bricolage/i.test(f) ? 'display' : /Mono|monospace/i.test(f) ? 'mono' : 'ui';
  return { size, role, weight };
}

export function installMeasurer(m: TextMeasurer): void {
  echarts.setPlatformAPI({
    measureText(text: string, font?: string) {
      const { size, role, weight } = parseFont(font);
      return { width: m.width(String(text), size, role, weight) };
    },
  });
}

export function ssrInstance(w: number, h: number): echarts.ECharts {
  return echarts.init(null, null, { renderer: 'svg', ssr: true, width: w, height: h });
}
