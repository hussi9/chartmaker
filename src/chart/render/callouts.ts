// A callout is a dark pill pointing at the label of the row it talks about.
import type { ChartSpec } from '../types';
import type { Box, Frame, TextBox } from '../layout-types';
import type { TextMeasurer } from '../measure';
import { POST_SIZES } from '../types';

export interface CalloutPlacement { id: string; box: Box; text: string; size: number; pointer: { x: number; y: number }; flipped: boolean }

const PAD_X = 12;
const GAP = 14;

export function placeCallouts(spec: ChartSpec, f: Frame, boxes: TextBox[], m: TextMeasurer): CalloutPlacement[] {
  const scale = POST_SIZES[spec.size].w / 1600;
  const size = Math.max(12, Math.round(13 * scale));
  const out: CalloutPlacement[] = [];
  const taken: Box[] = [];
  for (const c of spec.callouts) {
    const row = spec.data.find((r) => r.id === c.anchor.rowId);
    if (!row) continue;
    const label = row.label.trim();
    const anchor = boxes.find((b) => b.text === label) ?? boxes.find((b) => b.text.startsWith(label));
    if (!anchor) continue;
    const w = m.width(c.text, size, 'ui', 600) + PAD_X * 2;
    const h = size + 12;
    let x = anchor.x + anchor.w + GAP;
    let flipped = false;
    if (x + w > f.w - f.pad) {
      x = anchor.x - GAP - w;
      flipped = true;
    }
    if (x < f.pad) x = f.pad;
    let y = anchor.y + anchor.h / 2 - h / 2;
    y = Math.max(f.plot.y - 4, Math.min(y, f.plot.y + f.plot.h - h));
    for (let guard = 0; guard < 8 && taken.some((t) => overlaps(t, { x, y, w, h })); guard++) y += h + 6;
    const box = { x, y, w, h };
    taken.push(box);
    out.push({ id: c.id, box, text: c.text, size, pointer: { x: flipped ? x + w : x, y: y + h / 2 }, flipped });
  }
  return out;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
