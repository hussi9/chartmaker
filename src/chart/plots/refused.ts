// What the plot box shows when a chart type refuses the rows (negatives in a funnel,
// too few points for a line). Drawing the reason beats drawing a wrong chart.
import type { EChartsOption } from '../echarts';
import { FONT_STACK } from '../echarts';
import type { PlotCtx } from './types';

export function refusedOption(reason: string, ctx: PlotCtx): EChartsOption {
  return {
    animation: false,
    graphic: [{
      type: 'text', left: 'center', top: 'middle',
      style: { text: reason, fill: ctx.look.muted, fontSize: ctx.look.label, fontFamily: FONT_STACK.ui, fontWeight: 500, width: ctx.plot.w * 0.8, overflow: 'break', align: 'center' },
    }],
  } as EChartsOption;
}
