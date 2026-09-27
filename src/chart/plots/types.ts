import type { EChartsOption } from '../echarts';
import type { Box } from '../layout-types';
import type { TextMeasurer } from '../measure';
import type { ChartSpec, ChartType, LookTokens, Row, Unit } from '../types';

export type PlotCategory = 'bars' | 'trends' | 'compare' | 'kpis' | 'funnels' | 'matrix';

export interface PlotCtx {
  spec: ChartSpec;
  rows: Row[];
  plot: Box;
  look: LookTokens;
  palette: string[];
  total: number;
  capped: number;
  m: TextMeasurer;
  fmt: (v: number, rowUnit?: Unit) => string;
  unit: Unit | undefined;
}

export type Accepts = { ok: true } | { ok: false; reason: string };

export interface PlotDef {
  type: ChartType;
  name: string;
  category: PlotCategory;
  blurb: string;
  sample: Row[];
  build(ctx: PlotCtx): EChartsOption;
  accepts(rows: Row[]): Accepts;
}
