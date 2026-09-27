// Renders the plot box of a spec through ECharts' server-side SVG renderer and
// returns the inner nodes, ready to be placed inside our frame. Works in the
// browser and in Node; the caller passes the measurer both sides agree on.
import type { ChartSpec } from '../types';
import type { Frame } from '../layout-types';
import { defaultMeasurer, type TextMeasurer } from '../measure';
import { installMeasurer, ssrInstance } from '../echarts';
import { PLOTS, plotContext } from '../plots';
import type { PlotCtx } from '../plots/types';
import { refusedOption } from '../plots/refused';
import type { EChartsOption } from '../echarts';

export function plotSvg(spec: ChartSpec, f: Frame, m: TextMeasurer = defaultMeasurer()): string {
  installMeasurer(m);
  const w = Math.max(1, Math.round(f.plot.w));
  const h = Math.max(1, Math.round(f.plot.h));
  const inst = ssrInstance(w, h);
  try {
    inst.setOption(buildOrRefuse(spec, plotContext(spec, f, m)));
    return stripSvgWrapper(inst.renderToSVGString());
  } finally {
    inst.dispose();
  }
}

/** The plot option, or the refusal notice when the type cannot draw these rows. */
export function buildOrRefuse(spec: ChartSpec, ctx: PlotCtx): EChartsOption {
  const a = PLOTS[spec.type].accepts(ctx.rows);
  return a.ok ? PLOTS[spec.type].build(ctx) : refusedOption(a.reason, ctx);
}

export function stripSvgWrapper(svg: string): string {
  return svg.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
