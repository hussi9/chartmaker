// The frame is everything around the plot: title block, handle badge, logo,
// footer (source · site), remix credit, and the box left over for the plot.
// Pure: (spec, measurer) → boxes. Same result in the browser and on the server.
import { LOOKS, POST_SIZES, type ChartSpec } from './types';
import type { TextMeasurer } from './measure';
import type { Box, Frame, TextBox } from './layout-types';

export const SITE_LABEL = 'chartgenie.xyz';
const GAP = 18;
const LINE = 1.15;

function truncate(text: string, maxW: number, size: number, m: TextMeasurer, role: 'display' | 'ui' | 'mono', weight: number): string {
  if (m.width(text, size, role, weight) <= maxW) return text;
  let t = text;
  while (t.length > 1 && m.width(t + '…', size, role, weight) > maxW) t = t.slice(0, -1).trimEnd();
  return t + '…';
}

function wrap(text: string, maxW: number, size: number, m: TextMeasurer, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (m.width(next, size, 'display', 800) <= maxW || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
    }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines) {
    const rest = words.slice(lines.join(' ').split(/\s+/).length).join(' ');
    const last = rest ? `${lines[maxLines - 1]} ${rest}` : lines[maxLines - 1];
    lines[maxLines - 1] = truncate(last, maxW, size, m, 'display', 800);
  }
  return lines;
}

export function frame(spec: ChartSpec, m: TextMeasurer): Frame {
  const { w, h } = POST_SIZES[spec.size];
  const look = LOOKS[spec.look];
  const scale = w / 1600;
  const pad = Math.round(w * 0.0275);
  const inner: Box = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2 };

  let badge: Frame['badge'];
  let badgeW = 0;
  if (spec.options.showHandle && spec.options.handle) {
    const text = `@${spec.options.handle.replace(/^@/, '')}`;
    const size = Math.max(11, Math.round(13 * scale));
    const tw = m.width(text, size, 'mono', 500);
    const pill: Box = { x: inner.x + inner.w - (tw + 24), y: inner.y, w: tw + 24, h: size + 14 };
    badge = { id: 'badge', text, size, role: 'mono', weight: 500, fill: look.ink, anchor: 'middle', x: pill.x + pill.w / 2, y: pill.y + 7, w: tw, h: size, pill };
    badgeW = pill.w + GAP;
  }

  let logo: Frame['logo'];
  if (spec.options.logoDataUrl) {
    const s = Math.round(40 * scale);
    const corner = spec.options.logoCorner ?? 'br';
    logo = {
      href: spec.options.logoDataUrl,
      w: s, h: s,
      x: corner.endsWith('l') ? inner.x : inner.x + inner.w - s,
      y: corner.startsWith('t') ? inner.y : inner.y + inner.h - s,
    };
  }

  const titleSize = Math.max(24, Math.round(look.title * scale));
  const titleMaxW = inner.w - badgeW;
  const titleLines = wrap(spec.text.title || ' ', titleMaxW, titleSize, m, 2);
  const title: TextBox[] = titleLines.map((text, i) => ({
    id: `title-${i}`, text, size: titleSize, role: 'display', weight: 800, fill: look.ink, anchor: 'start',
    x: inner.x, y: inner.y + i * titleSize * LINE, w: m.width(text, titleSize, 'display', 800), h: titleSize * LINE,
  }));
  let cursor = inner.y + titleLines.length * titleSize * LINE;

  let subtitle: TextBox | undefined;
  if (spec.text.subtitle) {
    const size = Math.max(11, Math.round(look.subtitle * scale));
    const text = truncate(spec.text.subtitle, titleMaxW, size, m, 'ui', 500);
    subtitle = { id: 'subtitle', text, size, role: 'ui', weight: 500, fill: look.muted, anchor: 'start', x: inner.x, y: cursor + 2, w: m.width(text, size, 'ui', 500), h: size * 1.3 };
    cursor += 2 + size * 1.3;
  }

  const footSize = Math.max(11, Math.round(11 * scale));
  const footH = footSize * 1.3;
  const footY = inner.y + inner.h - footH;
  const site: TextBox = { id: 'site', text: SITE_LABEL, size: footSize, role: 'mono', weight: 500, fill: look.muted, anchor: 'end', x: inner.x + inner.w, y: footY, w: m.width(SITE_LABEL, footSize, 'mono', 500), h: footH };
  let source: TextBox | undefined;
  if (spec.text.source) {
    const text = `Source: ${spec.text.source}`;
    source = { id: 'source', text: truncate(text, inner.w - site.w - GAP, footSize, m, 'mono', 500), size: footSize, role: 'mono', weight: 500, fill: look.muted, anchor: 'start', x: inner.x, y: footY, w: 0, h: footH };
    source.w = m.width(source.text, footSize, 'mono', 500);
  }
  let bottom = footY - GAP;
  let remix: TextBox | undefined;
  if (spec.options.remixedFrom) {
    const text = `remixed from @${spec.options.remixedFrom.replace(/^@/, '')}`;
    remix = { id: 'remix', text, size: footSize, role: 'mono', weight: 500, fill: look.muted, anchor: 'start', x: inner.x, y: footY - footH, w: m.width(text, footSize, 'mono', 500), h: footH };
    bottom = remix.y - GAP;
  }

  const plotTop = Math.max(cursor, badge ? badge.pill.y + badge.pill.h : 0) + GAP;
  const plot: Box = { x: inner.x, y: plotTop, w: inner.w, h: Math.max(0, bottom - plotTop) };

  return { w, h, pad, title, subtitle, badge, logo, source, site, remix, plot };
}
