// One click, every size: PNG + SVG per enabled size, caption.txt, alt-text.txt, zipped.
import type { ChartSpec, PostSizeId } from '../chart/types';
import { pngBlob } from './png';
import { svgBlob } from './svg';

export function exportFileStem(title: string): string {
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'chart';
}

export async function buildExportSet(spec: ChartSpec, sizes: PostSizeId[], caption: string, alt: string, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const stem = exportFileStem(spec.text.title);
  const total = sizes.length * 2;
  let done = 0;
  const tick = () => onProgress?.(++done, total);
  for (const size of sizes) {
    const suffix = size.replace(':', 'x');
    zip.file(`${stem}-${suffix}.svg`, svgBlob(spec, size));
    tick();
    zip.file(`${stem}-${suffix}.png`, await pngBlob(spec, size));
    tick();
  }
  zip.file('caption.txt', caption);
  zip.file('alt-text.txt', alt);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}
