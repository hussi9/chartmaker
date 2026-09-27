// Renders the plot box of a spec through ECharts' server-side SVG renderer and
// returns the inner nodes, ready to be placed inside our frame. Works in the
// browser and in Node; the caller passes the measurer both sides agree on.
import type { ChartSpec } from '../types';
import type { Frame } from '../layout-types';
import { defaultMeasurer, type TextMeasurer } from '../measure';
import { installMeasurer, ssrInstance } from '../echarts';
import { PLOTS, plotContext } from '../plots';

export function plotSvg(spec: ChartSpec, f: Frame, m: TextMeasurer = defaultMeasurer()): string {
  installMeasurer(m);
  const w = Math.max(1, Math.round(f.plot.w));
  const h = Math.max(1, Math.round(f.plot.h));
  const inst = ssrInstance(w, h);
  try {
    inst.setOption(PLOTS[spec.type].build(plotContext(spec, f, m)));
    return stripSvgWrapper(inst.renderToSVGString());
  } finally {
    inst.dispose();
  }
}

export function stripSvgWrapper(svg: string): string {
  return svg.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
