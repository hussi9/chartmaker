// PNG export at true post size (2× for crisp phones by default).
import type { ChartSpec, PostSizeId } from '../chart/types';
import { POST_SIZES } from '../chart/types';
import { svgStringForExport } from './svg';
import type { RenderRequest, RenderResponse } from './worker';

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (b: Blob) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<RenderResponse>) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.png) p.resolve(new Blob([e.data.png], { type: 'image/png' }));
      else p.reject(new Error(e.data.error ?? 'Render failed'));
    };
    worker.onerror = (ev) => {
      for (const p of pending.values()) p.reject(new Error(ev.message || 'Export worker failed'));
      pending.clear();
    };
  }
  return worker;
}

export function pngBlob(spec: ChartSpec, size: PostSizeId, scale: 1 | 2 = 2): Promise<Blob> {
  const svg = svgStringForExport(spec, size);
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, svg, width: POST_SIZES[size].w * scale } satisfies RenderRequest);
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function copyPng(spec: ChartSpec, size: PostSizeId): Promise<void> {
  // Safari needs the ClipboardItem created synchronously with a promise inside.
  const item = new ClipboardItem({ 'image/png': pngBlob(spec, size) });
  await navigator.clipboard.write([item]);
}

export async function sharePng(spec: ChartSpec, size: PostSizeId, caption: string, filename: string): Promise<'shared' | 'unsupported'> {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return 'unsupported';
  const blob = await pngBlob(spec, size);
  const file = new File([blob], filename, { type: 'image/png' });
  if (!navigator.canShare({ files: [file] })) return 'unsupported';
  await navigator.share({ files: [file], text: caption, title: spec.text.title });
  return 'shared';
}
