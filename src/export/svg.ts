import { svgString } from '../chart/render/svgString';
import '../chart/render/fonts.browser';
import type { ChartSpec, PostSizeId } from '../chart/types';

// A real vector file: the same SVG the artboard shows, with the three fonts embedded.
export function svgStringForExport(spec: ChartSpec, size: PostSizeId): string {
  return svgString({ ...spec, size }, { embedFonts: true });
}

export function svgBlob(spec: ChartSpec, size: PostSizeId): Blob {
  return new Blob([svgStringForExport(spec, size)], { type: 'image/svg+xml' });
}
