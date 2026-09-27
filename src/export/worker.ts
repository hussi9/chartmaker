// Rasterises an SVG string to PNG with resvg (wasm) off the main thread.
// Fonts are loaded once from /fonts; nothing leaves the device.
import { initWasm, Resvg } from '@resvg/resvg-wasm';

export interface RenderRequest { id: number; svg: string; width: number }
export interface RenderResponse { id: number; png?: ArrayBuffer; error?: string }

const FONT_FILES = ['/fonts/BricolageGrotesque.ttf', '/fonts/Geist.ttf', '/fonts/GeistMono.ttf'];
let ready: Promise<Uint8Array[]> | null = null;

function boot(): Promise<Uint8Array[]> {
  if (!ready) {
    ready = (async () => {
      await initWasm(fetch('/resvg.wasm'));
      const buffers = await Promise.all(FONT_FILES.map(async (f) => new Uint8Array(await (await fetch(f)).arrayBuffer())));
      return buffers;
    })();
  }
  return ready;
}

self.onmessage = async (e: MessageEvent<RenderRequest>) => {
  const { id, svg, width } = e.data;
  try {
    const fontBuffers = await boot();
    const r = new Resvg(svg, {
      fitTo: { mode: 'width', value: width },
      font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'Geist Variable' },
    });
    const png = r.render().asPng();
    const buf = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
    (self as unknown as Worker).postMessage({ id, png: buf } satisfies RenderResponse, [buf]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: err instanceof Error ? err.message : String(err) } satisfies RenderResponse);
  }
};
