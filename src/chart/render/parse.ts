// Reads the <text> nodes ECharts emits back into boxes in frame coordinates so
// callouts can anchor to them and the post-ready checks can measure them.
import type { Box, TextBox } from '../layout-types';
import type { FontRole, TextMeasurer } from '../measure';

const TEXT_RE = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;

function attr(attrs: string, name: string): string | undefined {
  const m = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs);
  return m?.[1];
}

function styleProp(style: string | undefined, prop: string): string | undefined {
  if (!style) return undefined;
  const m = new RegExp(`${prop}:\\s*([^;]+)`).exec(style);
  return m?.[1].trim();
}

export function decodeEntities(s: string): string {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

export function textBoxes(svg: string, offset: Box, m: TextMeasurer): TextBox[] {
  const out: TextBox[] = [];
  let i = 0;
  for (const match of svg.matchAll(TEXT_RE)) {
    const attrs = match[1];
    const text = decodeEntities(match[2].replace(/<[^>]+>/g, '')).trim();
    if (!text) continue;
    const style = attr(attrs, 'style');
    const size = Number.parseFloat(styleProp(style, 'font-size') ?? '12') || 12;
    const family = styleProp(style, 'font-family') ?? '';
    const role: FontRole = /Bricolage/i.test(family) ? 'display' : /Mono|monospace/i.test(family) ? 'mono' : 'ui';
    const weight = Number.parseInt(styleProp(style, 'font-weight') ?? '400', 10) || 400;
    const anchor = (attr(attrs, 'text-anchor') as TextBox['anchor'] | undefined) ?? 'start';
    const fill = attr(attrs, 'fill') ?? '#000000';
    const tr = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(attr(attrs, 'transform') ?? '');
    const tx = tr ? Number(tr[1]) : 0;
    const ty = tr ? Number(tr[2]) : 0;
    const lx = Number(attr(attrs, 'x') ?? 0);
    const ly = Number(attr(attrs, 'y') ?? 0);
    const w = m.width(text, size, role, weight);
    const ax = tx + lx;
    const x = anchor === 'middle' ? ax - w / 2 : anchor === 'end' ? ax - w : ax;
    const central = (attr(attrs, 'dominant-baseline') ?? '') === 'central';
    const y = ty + ly - (central ? size / 2 : size * 0.8);
    out.push({ id: `plot-text-${i++}`, text, size, role, weight, fill, anchor, x: offset.x + x, y: offset.y + y, w, h: size });
  }
  return out;
}
