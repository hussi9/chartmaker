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
  const { PaddleOcrService } = await import('ppu-paddle-ocr');
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

export function _setLoadersForTests(overrides: Partial<typeof loaders>): void {
  loaders = { ...loaders, ...overrides };
  cached = null;
}

export function _resetEngineForTests(): void {
  loaders = { primary: loadPrimaryRecognizer, fallback: loadFallbackRecognizer };
  cached = null;
}

/** True once an engine has been loaded and cached — callers use this to tell a slow, one-time model download apart from a fast, per-image read. */
export function isEngineReady(): boolean {
  return cached !== null;
}

export async function recognizeImage(file: File): Promise<string[]> {
  if (!cached) {
    try {
      cached = await loaders.primary();
    } catch {
      cached = await loaders.fallback();
    }
  }
  return cached(file);
}
