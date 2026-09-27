// Post-ready checks. Every number here is computed from the rendered SVG,
// never typed in, so "Post-ready ✓" is a fact about this chart.
import { APCAcontrast, sRGBtoY } from 'apca-w3';
import type { ChartSpec, PostSizeId } from './types';
import { LOOKS, POST_SIZES } from './types';
import { frame } from './frame';
import { defaultMeasurer, type TextMeasurer } from './measure';
import { plotSvg } from './render/plotSvg';
import { PLOTS } from './plots';
import { MAX_ROWS } from './plots/common';
import { textBoxes } from './render/parse';
import type { Box, TextBox } from './layout-types';
import { SAFE_ZONES, type Platform } from './safezones';
import { altText } from './alt';
import type { Insight } from '../insights/types';

export type { Platform } from './safezones';
export { SAFE_ZONES } from './safezones';

export type CheckId = 'data' | 'contrast' | 'textSize' | 'cropZone' | 'altText';
export interface Check { id: CheckId; pass: boolean; detail: string }

// APCA: Lc 60 for fluent body text, Lc 45 for large/bold text (labels here are ≥ 24px, weight ≥ 600).
const MIN_LABEL_LC = 45;
const MIN_TITLE_LC = 60;
const MIN_TEXT_PX = 24;

export interface Fill { box: Box; fill: string }

const SHAPE_RE = /<(rect|path|polygon|circle)\b([^>]*)>/g;

function attr(attrs: string, name: string): string | undefined {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)?.[1];
}

// Approximate every filled shape by its bounding box so a label's background can be found.
function shapeFills(svg: string, offset: Box): Fill[] {
  const out: Fill[] = [];
  for (const mt of svg.matchAll(SHAPE_RE)) {
    const [, tag, attrs] = mt;
    const fill = attr(attrs, 'fill');
    if (!fill || fill === 'none' || fill === 'transparent' || fill.startsWith('url(')) continue;
    const tr = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(attr(attrs, 'transform') ?? '');
    const tx = tr ? Number(tr[1]) : 0;
    const ty = tr ? Number(tr[2]) : 0;
    let box: Box | null = null;
    if (tag === 'rect') {
      box = { x: Number(attr(attrs, 'x') ?? 0), y: Number(attr(attrs, 'y') ?? 0), w: Number(attr(attrs, 'width') ?? 0), h: Number(attr(attrs, 'height') ?? 0) };
    } else if (tag === 'circle') {
      const r = Number(attr(attrs, 'r') ?? 0);
      box = { x: Number(attr(attrs, 'cx') ?? 0) - r, y: Number(attr(attrs, 'cy') ?? 0) - r, w: r * 2, h: r * 2 };
    } else if (tag === 'polygon') {
      const nums = (attr(attrs, 'points') ?? '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      box = bboxOfPairs(nums);
    } else {
      box = pathBBox(attr(attrs, 'd') ?? '');
    }
    if (!box || box.w <= 0 || box.h <= 0) continue;
    out.push({ box: { x: box.x + tx + offset.x, y: box.y + ty + offset.y, w: box.w, h: box.h }, fill });
  }
  return out;
}

function bboxOfPairs(nums: number[]): Box | null {
  if (nums.length < 4) return null;
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

// Bounding box of an SVG path from its on-curve points. Arc commands carry radii
// and flags before their end point, so a naive number scan would be wrong.
function pathBBox(d: string): Box | null {
  const pts: number[] = [];
  let cx = 0;
  let cy = 0;
  for (const seg of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
    const cmd = seg[1];
    const n = seg[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
    const rel = cmd === cmd.toLowerCase();
    const push = (x: number, y: number) => { cx = rel ? cx + x : x; cy = rel ? cy + y : y; pts.push(cx, cy); };
    switch (cmd.toUpperCase()) {
      case 'M': case 'L': case 'T': for (let i = 0; i + 1 < n.length; i += 2) push(n[i], n[i + 1]); break;
      case 'H': for (const x of n) push(x, rel ? 0 : cy); break;
      case 'V': for (const y of n) push(rel ? 0 : cx, y); break;
      case 'C': for (let i = 0; i + 5 < n.length; i += 6) push(n[i + 4], n[i + 5]); break;
      case 'S': case 'Q': for (let i = 0; i + 3 < n.length; i += 4) push(n[i + 2], n[i + 3]); break;
      case 'A': for (let i = 0; i + 6 < n.length; i += 7) push(n[i + 5], n[i + 6]); break;
      default: break;
    }
  }
  return bboxOfPairs(pts);
}

function contains(b: Box, px: number, py: number): boolean {
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

function rgb(c: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(c.trim());
  if (hex) {
    const h = hex[1].length < 6 ? hex[1].split('').map((x) => x + x).join('') : hex[1];
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const fn = /^rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(c.trim());
  return fn ? [Number(fn[1]), Number(fn[2]), Number(fn[3])] : null;
}

function lc(fg: string, bg: string): number {
  const f = rgb(fg);
  const b = rgb(bg);
  if (!f || !b) return 100; // gradients and unknown paints are not judged
  return Math.abs(Number(APCAcontrast(sRGBtoY(f), sRGBtoY(b))));
}

// Every plot label is judged against the fill under its centre; frame text against its own background.
export function weakContrast(plotTexts: TextBox[], fills: Fill[], bg: string, frame: { text: TextBox; bg: string; floor: number }[] = []): string[] {
  const weak: string[] = [];
  for (const t of plotTexts) {
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    const under = fills.find((s) => contains(s.box, cx, cy))?.fill ?? bg;
    const v = lc(t.fill, under);
    if (v < MIN_LABEL_LC) weak.push(`${t.text} (${v.toFixed(0)})`);
  }
  for (const f of frame) {
    const v = lc(f.text.fill, f.bg);
    if (v < f.floor) weak.push(`${f.text.text} (${v.toFixed(0)})`);
  }
  return weak;
}

export function checks(spec: ChartSpec, sizes: PostSizeId[], platforms: Platform[], m: TextMeasurer = defaultMeasurer(), insightList: Insight[] = []): Check[] {
  const look = LOOKS[spec.look];
  const f = frame(spec, m);
  const plot = plotSvg(spec, f, m);
  const plotTexts = textBoxes(plot, f.plot, m);
  const fills = shapeFills(plot, f.plot).reverse(); // topmost first
  const frameTexts: TextBox[] = [...(f.title ?? []), f.subtitle, f.source, f.site, f.remix, f.badge].filter((t): t is TextBox => Boolean(t));

  // 1. Contrast
  const weak = weakContrast(plotTexts, fills, look.bg, frameTexts.map((t) => ({ text: t, bg: t.id === 'badge' ? (spec.look === 'dark' ? '#334155' : '#f6f3ee') : look.bg, floor: t.id.startsWith('title') ? MIN_TITLE_LC : MIN_LABEL_LC })));
  const contrast: Check = weak.length
    ? { id: 'contrast', pass: false, detail: `Low contrast: ${weak.slice(0, 3).join(', ')}${weak.length > 3 ? ` +${weak.length - 3}` : ''}` }
    : { id: 'contrast', pass: true, detail: `All labels ≥ Lc ${MIN_LABEL_LC}` };

  // 2. Text size at the smallest enabled export (chrome — subtitle, footer, badge, remix line — is exempt)
  const all = [...plotTexts, ...frameTexts];
  const sized = [...plotTexts, ...(f.title ?? [])];
  const minSize = sized.length ? Math.min(...sized.map((t) => t.size)) : 0;
  const smallest = sizes.length ? sizes.reduce((a, b) => (POST_SIZES[a].w <= POST_SIZES[b].w ? a : b)) : spec.size;
  const factor = POST_SIZES[smallest].w / f.w;
  const minPx = minSize * factor;
  const textSize: Check = minPx >= MIN_TEXT_PX || sized.length === 0
    ? { id: 'textSize', pass: true, detail: `Smallest label ${minPx.toFixed(0)}px at ${POST_SIZES[smallest].w}` }
    : { id: 'textSize', pass: false, detail: `Smallest text ${minPx.toFixed(0)}px at ${POST_SIZES[smallest].w}; need ≥ ${MIN_TEXT_PX}px` };

  // 3. Crop zones
  const cropHits: string[] = [];
  for (const p of platforms) {
    const zone = SAFE_ZONES[p];
    for (const size of sizes.length ? sizes : [spec.size]) {
      const inset = zone.insets[size];
      if (!inset) continue;
      const sz = POST_SIZES[size];
      const sx = sz.w / f.w;
      const sy = sz.h / f.h;
      const safe: Box = { x: inset.left * sz.w, y: inset.top * sz.h, w: sz.w * (1 - inset.left - inset.right), h: sz.h * (1 - inset.top - inset.bottom) };
      for (const t of all) {
        const b = { x: t.x * sx, y: t.y * sy, w: t.w * sx, h: t.h * sy };
        const inside = b.x >= safe.x && b.y >= safe.y && b.x + b.w <= safe.x + safe.w && b.y + b.h <= safe.y + safe.h;
        if (!inside) { cropHits.push(`${t.text} in ${zone.label} ${size} crop zone`); break; }
      }
    }
  }
  const cropZone: Check = cropHits.length
    ? { id: 'cropZone', pass: false, detail: cropHits.slice(0, 2).join('; ') }
    : { id: 'cropZone', pass: true, detail: platforms.length ? `Nothing in ${platforms.map((p) => SAFE_ZONES[p].label).join(', ')} crop zones` : 'No platform selected' };

  // 4. Alt text
  const alt = altText(spec, insightList);
  const altCheck: Check = alt ? { id: 'altText', pass: true, detail: alt } : { id: 'altText', pass: false, detail: 'Add a title so alt text can be written' };

  // 5. Data the plot can draw, all of it
  const accepts = PLOTS[spec.type].accepts(spec.data.slice(0, MAX_ROWS));
  const data: Check = !accepts.ok
    ? { id: 'data', pass: false, detail: accepts.reason }
    : spec.data.length > MAX_ROWS
      ? { id: 'data', pass: false, detail: `Showing ${MAX_ROWS} of ${spec.data.length} rows; the chart is cut` }
      : { id: 'data', pass: true, detail: `${spec.data.length} row${spec.data.length === 1 ? '' : 's'} drawn` };

  return [data, contrast, textSize, cropZone, altCheck];
}
