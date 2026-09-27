// Option fragments every builder composes from. Keep every look decision here
// so a change to the design lands in one place.
import type { EChartsOption } from '../echarts';
import { FONT_STACK } from '../echarts';
import { formatAxis, formatNumber } from '../format';
import type { PlotCtx, Accepts } from './types';
import type { Row } from '../types';

export const MAX_ROWS = 60;

export function baseOption(ctx: PlotCtx): EChartsOption {
  const { look, spec } = ctx;
  return {
    animation: false,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT_STACK.ui, color: look.ink, fontSize: look.label },
    grid: { left: 0, right: 0, top: 8, bottom: 0, containLabel: true },
    ...(spec.options.legend
      ? {
          legend: {
            bottom: 0, left: 0, itemGap: 16, itemWidth: 12, itemHeight: 12, icon: 'circle',
            textStyle: { color: look.ink, fontSize: look.label, fontFamily: FONT_STACK.ui },
          },
          grid: { left: 0, right: 0, top: 8, bottom: look.label + 20, containLabel: true },
        }
      : {}),
  };
}

export function itemStyle(color: string, ctx: PlotCtx): Record<string, unknown> {
  const { look, spec } = ctx;
  if (!spec.options.depth) return { color, borderRadius: look.radius };
  return {
    color: {
      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: mix(color, '#ffffff', 0.28) },
        { offset: 0.45, color },
        { offset: 1, color: mix(color, '#000000', 0.22) },
      ],
    },
    borderRadius: look.radius,
    shadowBlur: 12,
    shadowOffsetY: 6,
    shadowColor: 'rgba(30,41,59,0.28)',
  };
}

export function labelStyle(ctx: PlotCtx, inside: boolean, onColor?: string): Record<string, unknown> {
  const { look } = ctx;
  return {
    fontFamily: FONT_STACK.mono,
    fontSize: look.value,
    fontWeight: 600,
    color: inside ? contrastInk(onColor ?? ctx.palette[0]) : look.ink,
  };
}

export function categoryAxis(ctx: PlotCtx, labels: string[], horizontal = false): Record<string, unknown> {
  const { look } = ctx;
  return {
    type: 'category',
    data: labels,
    axisTick: { show: false },
    axisLine: { show: !horizontal, lineStyle: { color: look.grid } },
    axisLabel: { color: look.muted, fontSize: look.label, fontFamily: FONT_STACK.ui, margin: 12, interval: 0, hideOverlap: true, overflow: 'truncate', width: horizontal ? Math.round(ctx.plot.w * 0.28) : Math.round((ctx.plot.w / Math.max(1, labels.length)) * 0.9) },
  };
}

export function valueAxis(ctx: PlotCtx, horizontal = false): Record<string, unknown> {
  const { look, spec } = ctx;
  return {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: spec.options.grid && !horizontal, lineStyle: { color: look.grid, type: 'dashed' } },
    axisLabel: { show: !horizontal, color: look.muted, fontSize: look.label - 2, fontFamily: FONT_STACK.mono, formatter: (v: number) => formatAxis(v, ctx.unit) },
  };
}

export function ruleLine(ctx: PlotCtx, horizontal = false): Record<string, unknown> | undefined {
  const rule = ctx.spec.options.rule;
  if (!rule) return undefined;
  const value = rule.kind === 'avg' ? ctx.rows.reduce((a, r) => a + r.value, 0) / Math.max(1, ctx.rows.length) : rule.value;
  const text = rule.kind === 'avg' ? `avg ${formatNumber(value, ctx.unit)}` : formatNumber(value, ctx.unit);
  return {
    silent: true,
    symbol: 'none',
    lineStyle: { color: ctx.look.muted, type: 'dashed', width: 2 },
    label: { formatter: text, position: horizontal ? 'end' : 'insideEndTop', color: ctx.look.ink, fontFamily: FONT_STACK.mono, fontSize: ctx.look.label - 1 },
    data: [horizontal ? { xAxis: value, label: { formatter: text } } : { yAxis: value, label: { formatter: text } }],
  };
}

export function ghostSeries(ctx: PlotCtx, base: Record<string, unknown>): Record<string, unknown> | null {
  const ghost = ctx.spec.options.ghost;
  if (!ghost || ghost.length === 0) return null;
  return {
    ...base,
    name: 'previous',
    silent: true,
    z: 1,
    itemStyle: { color: ctx.look.muted, opacity: 0.35, borderRadius: ctx.look.radius },
    lineStyle: { color: ctx.look.muted, opacity: 0.35 },
    label: { show: false },
    data: ghost.map((r) => r.value),
  };
}

export function needRows(rows: Row[], min: number, what: string): Accepts {
  return rows.length >= min ? { ok: true } : { ok: false, reason: `${what} needs at least ${min} row${min === 1 ? '' : 's'}` };
}

export function nonNegative(rows: Row[], what: string): Accepts {
  return rows.some((r) => r.value < 0) ? { ok: false, reason: `${what} needs values ≥ 0` } : { ok: true };
}

export function contrastInk(hex: string): string {
  const { r, g, b } = rgb(hex);
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return y > 0.4 ? '#1e293b' : '#ffffff';
}

export function mix(a: string, b: string, t: number): string {
  const A = rgb(a); const B = rgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[c(A.r, B.r), c(A.g, B.g), c(A.b, B.b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lin(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
