// Picks an on-device OCR engine and normalizes its output to plain text
// lines. PaddleOCR (ppu-paddle-ocr) is the primary engine: per its own
// documentation it already runs on WebGPU when available and falls back to
// WASM automatically with no code on our side needed for that split.
// Tesseract.js is a genuine last-resort fallback only if the primary engine
// itself fails to load (e.g. its model assets can't be fetched). Nothing
// here is imported eagerly — see src/insights/detectImage.ts for the only
// caller, reached by dynamic import from the picture-intake UI.
export type Recognizer = (file: File) => Promise<string[]>;

function linesFrom(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

async function loadPrimaryRecognizer(): Promise<Recognizer> {
  // The package's default entry ("ppu-paddle-ocr") always pulls in its
  // Node/OpenCV processing path (ppu-ocv → @napi-rs/canvas, a native
  // addon) even when unused at runtime, which a browser bundler cannot
  // build at all (confirmed: `vite build` fails on its .node binary). The
  // dedicated "ppu-paddle-ocr/web" entry is built for exactly this case —
  // HTMLCanvasElement/OffscreenCanvas only, no native dependency — and
  // documents the same PaddleOcrService API used here.
  const { PaddleOcrService } = await import('ppu-paddle-ocr/web');
  const service = new PaddleOcrService();
  await service.initialize();
  return async (file: File) => {
    const buf = await file.arrayBuffer();
    const result = await service.recognize(buf);
    return linesFrom(result.text);
  };
}

async function loadFallbackRecognizer(): Promise<Recognizer> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  return async (file: File) => {
    const { data } = await worker.recognize(file);
    return linesFrom(data.text);
  };
}

let loaders = { primary: loadPrimaryRecognizer, fallback: loadFallbackRecognizer };
let cached: Recognizer | null = null;
let loading: Promise<Recognizer> | null = null;

export function _setLoadersForTests(overrides: Partial<typeof loaders>): void {
  loaders = { ...loaders, ...overrides };
  cached = null;
  loading = null;
}

export function _resetEngineForTests(): void {
  loaders = { primary: loadPrimaryRecognizer, fallback: loadFallbackRecognizer };
  cached = null;
  loading = null;
}

/** True once an engine has been loaded and cached — callers use this to tell a slow, one-time model download apart from a fast, per-image read. */
export function isEngineReady(): boolean {
  return cached !== null;
}

// Two pictures picked before the first model download finishes must share
// that one download, not each start their own (a real out-of-memory risk on
// a phone: two ORT sessions in memory at once). Callers that need to show a
// distinct "setting up" phase — see Intake.tsx's handleImage — await this
// directly, before starting their own per-read timeout, so that budget
// never has to cover the model download too.
export function ensureEngine(): Promise<Recognizer> {
  if (cached) return Promise.resolve(cached);
  if (!loading) {
    loading = (async () => {
      try {
        return await loaders.primary();
      } catch {
        return await loaders.fallback();
      }
    })().then(
      (recognizer) => { cached = recognizer; loading = null; return recognizer; },
      (error) => { loading = null; throw error; },
    );
  }
  return loading;
}

export async function recognizeImage(file: File): Promise<string[]> {
  const recognizer = await ensureEngine();
  return recognizer(file);
}
