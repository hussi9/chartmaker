// Assembles the final SVG: background, frame text, badge, logo, the ECharts
// plot translated into the plot box, callout pills, footer.
import type { ChartSpec } from '../types';
import { LOOKS } from '../types';
import type { Frame, TextBox } from '../layout-types';
import { FONT_FAMILY } from '../measure';
import type { CalloutPlacement } from './callouts';
import { fontFaceCss } from './fonts-embed';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function text(b: TextBox): string {
  const x = b.anchor === 'middle' ? b.x + b.w / 2 : b.anchor === 'end' ? b.x + b.w : b.x;
  const y = b.y + b.size * 0.86;
  return `<text x="${r(x)}" y="${r(y)}" font-family="${FONT_FAMILY[b.role]}" font-size="${b.size}" font-weight="${b.weight}" fill="${b.fill}" text-anchor="${b.anchor}">${esc(b.text)}</text>`;
}

const r = (n: number): string => (Math.round(n * 100) / 100).toString();

export function compose(spec: ChartSpec, f: Frame, plot: string, callouts: CalloutPlacement[], opts: { embedFonts?: boolean } = {}): string {
  const look = LOOKS[spec.look];
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${f.w}" height="${f.h}" viewBox="0 0 ${f.w} ${f.h}">`);
  if (opts.embedFonts) {
    const css = fontFaceCss();
    if (css) parts.push(`<style>${css}</style>`);
  }
  parts.push(`<rect x="0" y="0" width="${f.w}" height="${f.h}" fill="${look.bg}"/>`);
  if (look.border) parts.push(`<rect x="1" y="1" width="${f.w - 2}" height="${f.h - 2}" fill="none" stroke="${look.border}" stroke-width="2"/>`);
  for (const t of f.title ?? []) parts.push(text(t));
  if (f.subtitle) parts.push(text(f.subtitle));
  if (f.badge) {
    const p = f.badge.pill;
    const pillFill = spec.look === 'dark' ? '#334155' : '#f6f3ee';
    const pillStroke = spec.look === 'dark' ? '#475569' : '#e3ded6';
    parts.push(`<rect x="${r(p.x)}" y="${r(p.y)}" width="${r(p.w)}" height="${r(p.h)}" rx="999" fill="${pillFill}" stroke="${pillStroke}"/>`);
    parts.push(text({ ...f.badge, y: p.y + (p.h - f.badge.size) / 2 }));
  }
  if (f.logo) parts.push(`<image x="${r(f.logo.x)}" y="${r(f.logo.y)}" width="${r(f.logo.w)}" height="${r(f.logo.h)}" href="${esc(f.logo.href)}" preserveAspectRatio="xMidYMid meet"/>`);
  parts.push(`<g transform="translate(${r(f.plot.x)} ${r(f.plot.y)})">${plot}</g>`);
  for (const c of callouts) {
    const { box } = c;
    const tri = 6;
    const px = c.flipped ? box.x + box.w : box.x;
    const py = box.y + box.h / 2;
    const pointer = c.flipped
      ? `M${r(px)} ${r(py - tri)} L${r(px + tri)} ${r(py)} L${r(px)} ${r(py + tri)} Z`
      : `M${r(px)} ${r(py - tri)} L${r(px - tri)} ${r(py)} L${r(px)} ${r(py + tri)} Z`;
    parts.push(`<g id="callout-${esc(c.id)}"><rect x="${r(box.x)}" y="${r(box.y)}" width="${r(box.w)}" height="${r(box.h)}" rx="6" fill="#1e293b"/><path d="${pointer}" fill="#1e293b"/>`);
    parts.push(`<text x="${r(box.x + box.w / 2)}" y="${r(box.y + box.h / 2 + c.size * 0.36)}" font-family="${FONT_FAMILY.ui}" font-size="${c.size}" font-weight="600" fill="#ffffff" text-anchor="middle">${esc(c.text)}</text></g>`);
  }
  if (f.remix) parts.push(text(f.remix));
  if (f.source) parts.push(text(f.source));
  parts.push(text(f.site));
  parts.push('</svg>');
  return parts.join('');
}
