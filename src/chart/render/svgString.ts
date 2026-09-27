// One spec → one SVG string. The same function feeds the export worker, the
// share-card function and thumbnails, so what you see is what you post.
import type { ChartSpec } from '../types';
import { frame } from '../frame';
import { defaultMeasurer, type TextMeasurer } from '../measure';
import { plotSvg } from './plotSvg';
import { textBoxes } from './parse';
import { placeCallouts } from './callouts';
import { compose } from './compose';

export interface SvgStringOptions { embedFonts?: boolean; measure?: TextMeasurer }

export function svgString(spec: ChartSpec, opts: SvgStringOptions = {}): string {
  const m = opts.measure ?? defaultMeasurer();
  const f = frame(spec, m);
  const plot = plotSvg(spec, f, m);
  const callouts = spec.callouts.length ? placeCallouts(spec, f, textBoxes(plot, f.plot, m), m) : [];
  return compose(spec, f, plot, callouts, { embedFonts: opts.embedFonts });
}
