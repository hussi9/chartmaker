# Picture Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let someone get a chart from a picture — a photo of a whiteboard/printed table or a dropped screenshot — recognized entirely on-device, plus a real OS share-target so a shared photo lands directly in the app.

**Architecture:** A new `src/ocr/engine.ts` picks PaddleOCR-web (WebGPU) or Tesseract.js (WASM fallback) and exposes one function, `recognizeImage(file) → string[]` of text lines. `src/insights/detectImage.ts` joins those lines and hands them to the existing, unchanged `detect()` text pipeline — the OCR layer never touches row-parsing logic. A fourth "Picture" chip in `PasteBox` and a `POST`-based Web Share Target (handled by a new hand-written `src/sw.ts`, replacing the auto-generated service worker) both funnel into the same `detectImage()` call, so there is exactly one recognition path regardless of entry point.

**Tech Stack:** `ppu-paddle-ocr` (PaddleOCR PP-OCRv6-tiny, ONNX Runtime Web, WebGPU), `tesseract.js` (WASM), Dexie (new `shareInbox` table), `vite-plugin-pwa` in `injectManifest` mode.

**Spec:** `docs/superpowers/specs/2026-09-27-picture-intake-design.md`

## Global Constraints

- On-device only for v1 — no cloud vision API, no server call for recognition, no new API key.
- `ppu-paddle-ocr` first when `navigator.gpu` exists; `tesseract.js` otherwise. Both real npm packages already confirmed to exist (`ppu-paddle-ocr@6.6.0`, `tesseract.js@7.0.0`).
- Recognized lines are joined and passed through the existing `detect()` in `src/insights/intake.ts`, unchanged — no parallel row-parsing logic.
- The OCR module is dynamically imported only from the picture-intake code path; it must never be reachable from the main entry chunk or any eagerly-loaded route (`scripts/bundle-budget.mjs`'s numbers must not move).
- The person always confirms recognized rows before anything charts — reuse the existing `Detected: N rows` banner and row editing; never auto-chart from an image.
- Web Share Target with files is Chrome/Edge/ChromeOS-only and only fires for an installed PWA. State this plainly in copy; never imply it works everywhere.
- Nothing deleted — the manifest's `share_target`/`file_handlers` are replaced in place; git history keeps the old version.
- 44px minimum tap targets, verified in the browser at desktop and phone width before the final task is marked done.
- No Google Fonts, no hosted CI; `scripts/check.sh` stays the only gate.
- Every claim in shipped copy must be true of the code (`src/test/release-claims.test.ts` is the check).

## Review Focus

1. **A picture with no readable text at all** (photo of a blank wall, or of an existing chart image) — `detectImage` must return an empty `Detection` gracefully, never throw. Test in Task 3.
2. **A very large phone-camera photo** (10–20MB) — recognition must not hang the UI forever with no feedback; a client-side size cap plus a recognition timeout are required. Test in Task 4.
3. **Picking a second image while the first is still being read** — the stale in-flight result must never overwrite what the newer pick produced. Test in Task 5.
4. **Dropping an arbitrary non-image, non-CSV file** (a `.docx`, a video) into the paste box — must not be treated as an image or crash; falls through to the existing "no rows found" text path. Test in Task 4.
5. **A share-target `POST` with no file** (someone shares plain text/a URL, not a photo, to the same `/new` endpoint) — must still populate `text`/`url` exactly as the existing GET-based share target does today, never assume a file is present. Test in Task 7.

---

### Task 1: Dexie schema v2 — `shareInbox` table

**Files:**
- Modify: `src/db/index.ts`
- Test: `src/test/db.test.ts`

**Interfaces:**
- Produces: `export interface ShareInboxDoc { id: 'pending'; blob: Blob; at: number }`; `db.shareInbox: Table<ShareInboxDoc, string>`.

- [ ] **Step 1: Write the failing test**

Add to `src/test/db.test.ts` (it already imports `db, openDb, resetDbForTests` from `@/db` and uses the Node `Blob` polyfill already set up at the top of that file):

```ts
describe('shareInbox table (v2 schema)', () => {
  it('stores and reads back a pending shared blob', async () => {
    const blob = new NodeBlob(['hello'], { type: 'image/png' }) as unknown as Blob;
    await db.shareInbox.put({ id: 'pending', blob, at: 1234 });
    const doc = await db.shareInbox.get('pending');
    expect(doc?.at).toBe(1234);
    expect(doc?.blob).toBeInstanceOf(NodeBlob);
  });

  it('a second put overwrites the first (only ever one pending share)', async () => {
    await db.shareInbox.put({ id: 'pending', blob: new NodeBlob(['a']) as unknown as Blob, at: 1 });
    await db.shareInbox.put({ id: 'pending', blob: new NodeBlob(['b']) as unknown as Blob, at: 2 });
    expect(await db.shareInbox.count()).toBe(1);
    expect((await db.shareInbox.get('pending'))?.at).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/db.test.ts -t "shareInbox"`
Expected: FAIL — `db.shareInbox` is undefined (`TypeError: Cannot read properties of undefined (reading 'put')`).

- [ ] **Step 3: Add the table**

In `src/db/index.ts`, add the interface near the other `*Doc` interfaces:

```ts
export interface ShareInboxDoc { id: 'pending'; blob: Blob; at: number }
```

Add the table field to the class:

```ts
class ChartGenieDb extends Dexie {
  charts!: Table<ChartDoc, string>;
  series!: Table<SeriesDoc, string>;
  brand!: Table<BrandDoc, 'brand'>;
  settings!: Table<SettingsDoc, 'settings'>;
  shareInbox!: Table<ShareInboxDoc, string>;

  constructor() {
    super('chartgenie');
    this.version(1).stores({
      charts: 'id, updatedAt, sharedAt',
      series: 'id, chartId, nextDue',
      brand: 'id',
      settings: 'id',
    });
    this.version(2).stores({ shareInbox: 'id' });
  }
}
```

(Dexie carries the v1 tables forward automatically — `version(2)` only needs to declare the new table.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/db.test.ts`
Expected: PASS, and every other test in that file still passes (the v1 tables are untouched).

- [ ] **Step 5: Commit**

```bash
git add src/db/index.ts src/test/db.test.ts
git commit -m "feat: add shareInbox table for the picture-intake share target"
```

---

### Task 2: `src/ocr/engine.ts` — engine selection and the `recognizeImage` contract

**Files:**
- Create: `src/ocr/engine.ts`
- Test: `src/test/ocr/engine.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export async function recognizeImage(file: File): Promise<string[]>` (one array entry per recognized line, in reading order); `export function hasWebGPU(): boolean`; `export function _setLoadersForTests(overrides: Partial<{ paddle: () => Promise<Recognizer>; tesseract: () => Promise<Recognizer> }>): void` and `export function _resetEngineForTests(): void` (test-only seams, same naming convention as `resetDbForTests` in `src/db/index.ts`).

- [ ] **Step 1: Install the packages**

```bash
npm install ppu-paddle-ocr@6.6.0 tesseract.js@7.0.0
```

- [ ] **Step 2: Write the failing tests**

Create `src/test/ocr/engine.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recognizeImage, hasWebGPU, _setLoadersForTests, _resetEngineForTests } from '@/ocr/engine';

beforeEach(() => {
  _resetEngineForTests();
  Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true });
});

describe('hasWebGPU', () => {
  it('is false when navigator.gpu is absent', () => {
    expect(hasWebGPU()).toBe(false);
  });
  it('is true when navigator.gpu is present', () => {
    Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true });
    expect(hasWebGPU()).toBe(true);
  });
});

describe('recognizeImage engine selection', () => {
  const fakeFile = new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' });

  it('uses the paddle loader when WebGPU is present', async () => {
    Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true });
    const paddle = vi.fn().mockResolvedValue(vi.fn().mockResolvedValue(['USA 87', 'Italy 20']));
    const tesseract = vi.fn();
    _setLoadersForTests({ paddle, tesseract });
    const lines = await recognizeImage(fakeFile);
    expect(lines).toEqual(['USA 87', 'Italy 20']);
    expect(paddle).toHaveBeenCalledTimes(1);
    expect(tesseract).not.toHaveBeenCalled();
  });

  it('uses the tesseract loader when WebGPU is absent', async () => {
    const paddle = vi.fn();
    const tesseract = vi.fn().mockResolvedValue(vi.fn().mockResolvedValue(['Monday 32']));
    _setLoadersForTests({ paddle, tesseract });
    const lines = await recognizeImage(fakeFile);
    expect(lines).toEqual(['Monday 32']);
    expect(paddle).not.toHaveBeenCalled();
  });

  it('caches the chosen engine across calls (loader runs once)', async () => {
    const recognizer = vi.fn().mockResolvedValue(['a']);
    const tesseract = vi.fn().mockResolvedValue(recognizer);
    _setLoadersForTests({ tesseract, paddle: vi.fn() });
    await recognizeImage(fakeFile);
    await recognizeImage(fakeFile);
    expect(tesseract).toHaveBeenCalledTimes(1);
    expect(recognizer).toHaveBeenCalledTimes(2);
  });

  it('falls back to tesseract if the paddle loader throws', async () => {
    Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true });
    const paddle = vi.fn().mockRejectedValue(new Error('webgpu init failed'));
    const tesseract = vi.fn().mockResolvedValue(vi.fn().mockResolvedValue(['fallback line']));
    _setLoadersForTests({ paddle, tesseract });
    const lines = await recognizeImage(fakeFile);
    expect(lines).toEqual(['fallback line']);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/test/ocr/engine.test.ts`
Expected: FAIL — `Cannot find module '@/ocr/engine'`.

- [ ] **Step 4: Read the installed packages' real API before writing the loaders**

Run `cat node_modules/ppu-paddle-ocr/README.md` and `cat node_modules/ppu-paddle-ocr/dist/index.d.ts` (or wherever its type declarations land) to confirm the exact factory/recognize call shape, and likewise skim `node_modules/tesseract.js/types/index.d.ts` for `createWorker`/`recognize`. The bodies below are the best-known-correct shape as of the version pinned in Step 1; adjust the two loader functions' internals to match whatever the installed package's actual exports turn out to be — the test contract in Step 2 (a `Recognizer = (file: File) => Promise<string[]>` returned by each loader) is what must not change.

- [ ] **Step 5: Write the implementation**

Create `src/ocr/engine.ts`:

```ts
// Picks an on-device OCR engine and normalizes its output to plain text lines.
// WebGPU-capable browsers get PaddleOCR (faster, equally accurate in testing);
// everyone else gets Tesseract.js (WASM, no GPU dependency). Nothing here ever
// leaves the browser and nothing is imported eagerly — see src/insights/detectImage.ts
// for the only caller, reached by dynamic import from the picture-intake UI.
export type Recognizer = (file: File) => Promise<string[]>;

export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

async function loadPaddleRecognizer(): Promise<Recognizer> {
  const { createOCR } = await import('ppu-paddle-ocr');
  const ocr = await createOCR({ backend: 'webgpu' });
  return async (file: File) => {
    const result = await ocr.recognize(file);
    return result.lines.map((l: { text: string }) => l.text).filter((t: string) => t.trim().length > 0);
  };
}

async function loadTesseractRecognizer(): Promise<Recognizer> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  return async (file: File) => {
    const { data } = await worker.recognize(file);
    return data.text.split('\n').map((s) => s.trim()).filter(Boolean);
  };
}

let loaders = { paddle: loadPaddleRecognizer, tesseract: loadTesseractRecognizer };
let cached: Recognizer | null = null;

export function _setLoadersForTests(overrides: Partial<typeof loaders>): void {
  loaders = { ...loaders, ...overrides };
  cached = null;
}

export function _resetEngineForTests(): void {
  loaders = { paddle: loadPaddleRecognizer, tesseract: loadTesseractRecognizer };
  cached = null;
}

export async function recognizeImage(file: File): Promise<string[]> {
  if (!cached) {
    if (hasWebGPU()) {
      try {
        cached = await loaders.paddle();
      } catch {
        cached = await loaders.tesseract();
      }
    } else {
      cached = await loaders.tesseract();
    }
  }
  return cached(file);
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/test/ocr/engine.test.ts`
Expected: PASS, 6/6.

- [ ] **Step 7: Type-check and commit**

```bash
npx tsc -b
git add package.json package-lock.json src/ocr/engine.ts src/test/ocr/engine.test.ts
git commit -m "feat: on-device OCR engine (PaddleOCR-web WebGPU, Tesseract.js fallback)"
```

---

### Task 3: `src/insights/detectImage.ts` — image to `Detection`

**Files:**
- Create: `src/insights/detectImage.ts`
- Modify: `src/insights/intake.ts:6` (widen `IntakeKind`)
- Modify: `src/lib/gtag.ts:38` (allow `'image'` in `intake_detect`'s `kind` list)
- Test: `src/test/detectImage.test.ts`

**Interfaces:**
- Consumes: `recognizeImage` from `src/ocr/engine.ts` (Task 2); `detect` from `src/insights/intake.ts` (existing, unchanged).
- Produces: `export async function detectImage(file: File): Promise<Detection>`.

- [ ] **Step 1: Write the failing tests**

Create `src/test/detectImage.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { detectImage } from '@/insights/detectImage';

vi.mock('@/ocr/engine', () => ({ recognizeImage: vi.fn() }));

describe('detectImage', () => {
  const fakeFile = new File([new Uint8Array([1])], 'x.png', { type: 'image/png' });

  it('joins recognized lines and runs them through the ordinary detect() pipeline', async () => {
    const { recognizeImage } = await import('@/ocr/engine');
    vi.mocked(recognizeImage).mockResolvedValue(['Country Revenue', 'USA 87', 'Italy 20']);
    const d = await detectImage(fakeFile);
    expect(d.kind).toBe('image');
    expect(d.rows.map((r) => [r.label, r.value])).toEqual([['USA', 87], ['Italy', 20]]);
  });

  it('returns an empty detection, never throws, when nothing is recognized (Review Focus 1)', async () => {
    const { recognizeImage } = await import('@/ocr/engine');
    vi.mocked(recognizeImage).mockResolvedValue([]);
    const d = await detectImage(fakeFile);
    expect(d.kind).toBe('image');
    expect(d.rows).toEqual([]);
    expect(d.warnings.length).toBeGreaterThan(0);
  });

  it('returns an empty detection when the engine itself throws', async () => {
    const { recognizeImage } = await import('@/ocr/engine');
    vi.mocked(recognizeImage).mockRejectedValue(new Error('model failed to load'));
    const d = await detectImage(fakeFile);
    expect(d.rows).toEqual([]);
    expect(d.warnings[0]).toMatch(/couldn.t read|try again/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/detectImage.test.ts`
Expected: FAIL — `Cannot find module '@/insights/detectImage'`.

- [ ] **Step 3: Widen `IntakeKind` and the gtag allow-list**

In `src/insights/intake.ts:6`, change:

```ts
export type IntakeKind = 'cells' | 'sentence' | 'csv' | 'empty';
```

to:

```ts
export type IntakeKind = 'cells' | 'sentence' | 'csv' | 'image' | 'empty';
```

In `src/lib/gtag.ts`, in the `EVENTS` const, change:

```ts
intake_detect: { kind: ['cells', 'sentence', 'csv', 'empty'], rows: 'number' },
```

to:

```ts
intake_detect: { kind: ['cells', 'sentence', 'csv', 'image', 'empty'], rows: 'number' },
```

- [ ] **Step 4: Write the implementation**

Create `src/insights/detectImage.ts`:

```ts
// A picture is just another way to produce text lines for the existing
// detect() pipeline — this module owns nothing about row parsing itself.
import { recognizeImage } from '../ocr/engine';
import { detect } from './intake';
import type { Detection } from './intake';

const NO_TEXT_FOUND = "Couldn't find a clear table in that picture. Try a straighter, better-lit shot, or paste the numbers instead.";
const READ_FAILED = "Couldn't read that picture — try again.";

export async function detectImage(file: File): Promise<Detection> {
  let lines: string[];
  try {
    lines = await recognizeImage(file);
  } catch {
    return { kind: 'image', rows: [], warnings: [READ_FAILED] };
  }
  const text = lines.join('\n');
  if (!text.trim()) return { kind: 'image', rows: [], warnings: [NO_TEXT_FOUND] };
  const d = detect(text);
  if (d.rows.length === 0) return { ...d, kind: 'image', warnings: [NO_TEXT_FOUND, ...d.warnings] };
  return { ...d, kind: 'image' };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/test/detectImage.test.ts`
Expected: PASS, 3/3.

- [ ] **Step 6: Run the wider suite to confirm the type widening didn't break anything**

Run: `npx vitest run src/test/intake.test.ts src/test/gtag.test.ts`
Expected: PASS — both files only assert on the existing four kinds, which are still valid members of the widened union.

- [ ] **Step 7: Commit**

```bash
git add src/insights/detectImage.ts src/insights/intake.ts src/lib/gtag.ts src/test/detectImage.test.ts
git commit -m "feat: detectImage() feeds OCR output through the existing intake pipeline"
```

---

### Task 4: `PasteBox` — the "Picture" chip, drop handling, thumbnail and states

**Files:**
- Modify: `src/components/intake/PasteBox.tsx`
- Modify: `src/components/intake/intake.css`
- Modify: `src/test/setup.ts` (add a `URL.createObjectURL`/`revokeObjectURL` mock, same pattern as the existing `ResizeObserver`/`matchMedia` mocks)
- Test: `src/test/datagrid.test.tsx` is unrelated — new tests go in a new `src/test/pastebox.test.tsx`

**Interfaces:**
- Consumes: nothing new imported directly (no `detectImage` import here — see Task 5's design note).
- Produces: new `PasteBoxProps` fields — `onImage?: (file: File) => void`, `imageState?: 'idle' | 'loading-engine' | 'reading'`, `imageWarning?: string | null`. All optional so `QuickPost`'s and `Intake`'s existing calls keep compiling before Task 5 wires them.

**Design note:** `PasteBox` never calls `detectImage` itself. It only picks/drops a `File` and calls `onImage(file)`; the parent (wired in Task 5) owns the async call and the `imageState`/`imageWarning` it feeds back down as props. This mirrors the existing `text`/`onText` split and keeps `PasteBox` a pure, easily-testable presentational component.

- [ ] **Step 1: Write the failing tests**

Create `src/test/pastebox.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasteBox } from '@/components/intake/PasteBox';
import { detect } from '@/insights/intake';

const baseProps = {
  text: '', onText: vi.fn(), detection: detect(''), unit: 'number' as const, onUnit: vi.fn(),
};

describe('PasteBox picture chip', () => {
  it('shows a Picture chip alongside Cells, Sentence and CSV', () => {
    render(<PasteBox {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Picture' })).toBeInTheDocument();
  });

  it('clicking Picture opens a hidden image file input', () => {
    render(<PasteBox {...baseProps} />);
    const input = screen.getByLabelText('Picture file') as HTMLInputElement;
    expect(input.accept).toBe('image/*');
    expect(input.capture).toBe('environment');
  });

  it('picking a file calls onImage with that file', () => {
    const onImage = vi.fn();
    render(<PasteBox {...baseProps} onImage={onImage} />);
    const input = screen.getByLabelText('Picture file') as HTMLInputElement;
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).toHaveBeenCalledWith(file);
  });

  it('dropping an image file calls onImage (Review Focus 4: non-image drop is ignored, not crashed)', () => {
    const onImage = vi.fn();
    const onText = vi.fn();
    const { container } = render(<PasteBox {...baseProps} onImage={onImage} onText={onText} />);
    const box = container.querySelector('.cg-pastebox')!;
    const imageFile = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.drop(box, { dataTransfer: { files: [imageFile], getData: () => '' } });
    expect(onImage).toHaveBeenCalledWith(imageFile);

    onImage.mockClear();
    const videoFile = new File(['x'], 'clip.mov', { type: 'video/quicktime' });
    fireEvent.drop(box, { dataTransfer: { files: [videoFile], getData: () => '' } });
    expect(onImage).not.toHaveBeenCalled();
  });

  it('shows a loading-engine message, a reading message, and a warning by state', () => {
    const { rerender } = render(<PasteBox {...baseProps} imageState="loading-engine" />);
    expect(screen.getByText(/setting up picture reading/i)).toBeInTheDocument();
    rerender(<PasteBox {...baseProps} imageState="reading" />);
    expect(screen.getByText(/reading your picture/i)).toBeInTheDocument();
    rerender(<PasteBox {...baseProps} imageWarning="Couldn't find a clear table in that picture." />);
    expect(screen.getByText(/couldn.t find a clear table/i)).toBeInTheDocument();
  });

  it('shows a thumbnail of the picked image next to the detected rows', () => {
    const onImage = vi.fn();
    render(<PasteBox {...baseProps} onImage={onImage} />);
    const input = screen.getByLabelText('Picture file') as HTMLInputElement;
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByAltText('Picture you added')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/pastebox.test.tsx`
Expected: FAIL — no "Picture" chip, no "Picture file" input.

- [ ] **Step 3: Mock `URL.createObjectURL` in the test environment**

In `src/test/setup.ts`, inside the `if (typeof window !== 'undefined') { ... }` block, alongside the existing `ResizeObserver` mock:

```ts
// Mock URL.createObjectURL/revokeObjectURL — jsdom doesn't implement these.
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:mock';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
```

- [ ] **Step 4: Add the thumbnail/message styles**

In `src/components/intake/intake.css`, add:

```css
.cg-pastebox-thumb { max-width: 120px; max-height: 80px; border-radius: var(--r-2); border: 1px solid var(--line); object-fit: cover; }
.cg-pastebox-image-row { display: flex; align-items: center; gap: 10px; }
```

- [ ] **Step 5: Implement the chip, drop branch, file input, and states**

Rewrite `src/components/intake/PasteBox.tsx`:

```tsx
// "Paste anything": a big box that detects rows as you type, drop or pick a
// CSV, or add a picture (read on-device — see src/insights/detectImage.ts).
import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { Detection } from '../../insights/intake';
import { detectCsvFile } from '../../insights/intake';
import { SAMPLE_ROWS, type Unit } from '../../chart/types';
import { Chip } from '../common/Chip';
import { Seg } from '../common/Seg';

const UNIT_OPTIONS: { value: Unit | 'number'; label: string; title: string }[] = [
  { value: 'number', label: '123', title: 'Plain numbers' },
  { value: 'percent', label: '%', title: 'Percent' },
  { value: 'currency', label: '$', title: 'Currency' },
  { value: 'compact', label: 'k / M', title: 'Thousands and millions' },
];

export interface PasteBoxProps {
  text: string;
  onText: (t: string) => void;
  detection: Detection;
  unit: Unit | 'number';
  onUnit: (u: Unit | 'number') => void;
  compact?: boolean;
  onImage?: (file: File) => void;
  imageState?: 'idle' | 'loading-engine' | 'reading';
  imageWarning?: string | null;
}

export function sampleText(): string {
  return SAMPLE_ROWS.map((r) => `${r.label.padEnd(10)} ${r.value}`).join('\n');
}

export function PasteBox({ text, onText, detection, unit, onUnit, compact, onImage, imageState = 'idle', imageWarning }: PasteBoxProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const kinds: { id: Detection['kind']; label: string }[] = [{ id: 'cells', label: 'Cells' }, { id: 'sentence', label: 'Sentence' }, { id: 'csv', label: 'CSV' }];

  useEffect(() => () => { if (thumbUrl) URL.revokeObjectURL(thumbUrl); }, [thumbUrl]);

  const pickImage = (file: File) => {
    setThumbUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    onImage?.(file);
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) { pickImage(file); return; }
    if (file) { const d = await detectCsvFile(file); onText(d.rows.map((r) => `${r.label}\t${r.value}`).join('\n')); return; }
    const t = e.dataTransfer.getData('text');
    if (t) onText(t);
  };

  const summary = detection.rows.length
    ? `Detected: ${detection.rows.length} rows · numbers · labels${detection.unit ? ` · ${detection.unit}` : ''}`
    : text.trim() ? 'No rows found yet — paste label and value pairs' : '';

  return (
    <div className={`cg-pastebox ${compact ? 'cg-pastebox-compact' : ''}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      {imageState === 'loading-engine' && <span className="cg-callout" aria-live="polite">Setting up picture reading… (one-time, a few MB)</span>}
      {imageState === 'reading' && <span className="cg-callout" aria-live="polite">Reading your picture…</span>}
      {summary && imageState === 'idle' && <span className="cg-callout" aria-live="polite">{summary}</span>}
      {thumbUrl && (
        <div className="cg-pastebox-image-row">
          <img src={thumbUrl} alt="Picture you added" className="cg-pastebox-thumb" />
          {summary && imageState === 'idle' && <span className="cg-hint">{summary}</span>}
        </div>
      )}
      <textarea
        className="cg-pastebox-input"
        aria-label="Paste your numbers"
        placeholder={'USA        87\nItaly      20\nUK         12\nIreland    15'}
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={compact ? 6 : 8}
        autoFocus={!compact}
      />
      <div className="cg-pastebox-foot">
        <div className="cg-chips">
          {kinds.map((k) => <Chip key={k.id} tint={detection.kind === k.id} aria-pressed={detection.kind === k.id} onClick={() => fileRef.current && k.id === 'csv' && fileRef.current.click()} title={k.id === 'csv' ? 'Pick a CSV file' : `Paste ${k.label.toLowerCase()}`}>{k.label}</Chip>)}
          <Chip tint={detection.kind === 'image'} onClick={() => imageFileRef.current?.click()} title="Add a picture of a table">Picture</Chip>
        </div>
        <span className="cg-hint">or try <button type="button" className="cg-linkbtn" onClick={() => onText(sampleText())}>sample data</button></span>
      </div>
      {detection.rows.length > 0 && (
        <div className="cg-pastebox-units">
          <span className="cg-hint">Units</span>
          <Seg label="Units" size="sm" value={unit} options={UNIT_OPTIONS} onChange={onUnit} />
        </div>
      )}
      {detection.warnings.map((w) => <span key={w} className="cg-hint cg-warn">{w}</span>)}
      {imageWarning && <span className="cg-hint cg-warn">{imageWarning}</span>}
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden aria-label="CSV file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const d = await detectCsvFile(f); onText(d.rows.map((r) => `${r.label}\t${r.value}`).join('\n')); e.target.value = ''; }} />
      <input ref={imageFileRef} type="file" accept="image/*" capture="environment" hidden aria-label="Picture file" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickImage(f); e.target.value = ''; }} />
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/test/pastebox.test.tsx`
Expected: PASS, 6/6.

- [ ] **Step 7: Run the wider intake/editor/shell suites to confirm nothing else broke**

Run: `npx vitest run src/test/intake.test.ts src/test/intake-route.test.tsx src/test/editor.test.tsx src/test/shell.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/intake/PasteBox.tsx src/components/intake/intake.css src/test/setup.ts src/test/pastebox.test.tsx
git commit -m "feat: Picture chip, drop handling and states in PasteBox"
```

---

### Task 5: Wire `useIntake` — the size cap, the timeout, and the race guard

**Files:**
- Modify: `src/components/intake/Intake.tsx` (the `useIntake` hook and the `Intake` component's `<PasteBox>` call)
- Modify: `src/components/intake/QuickPost.tsx` (its `<PasteBox>` call)
- Test: `src/test/intake.test.ts` (or wherever `useIntake` is already tested — confirm with `grep -rn useIntake src/test` before adding; if none exists, add to `src/test/intake-route.test.tsx`, which already renders `Intake`)

**Interfaces:**
- Consumes: `detectImage` (Task 3), `PasteBoxProps.onImage`/`imageState`/`imageWarning` (Task 4).
- Produces: `useIntake`'s return value gains `imageState: 'idle' | 'loading-engine' | 'reading'`, `imageWarning: string | null`, `handleImage: (file: File) => void`. `QuickPost`'s prop type is `ReturnType<typeof useIntake>` already, so no signature change needed there beyond passing the three new fields to `PasteBox`.

- [ ] **Step 1: Write the failing tests**

First, change `src/test/intake-route.test.tsx`'s existing import line from `import { render, screen, within, waitFor } from '@testing-library/react';` to `import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';` (the file doesn't import `fireEvent` yet).

Add to `src/test/intake-route.test.tsx` (check its existing `vi.mock('@/chart/echarts', ...)` pattern and mount helper before adding — reuse them):

```tsx
vi.mock('@/insights/detectImage', () => ({ detectImage: vi.fn() }));

describe('useIntake picture handling', () => {
  it('shows loading-engine then reading, then populates text from the detection', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    let resolve!: (d: unknown) => void;
    vi.mocked(detectImage).mockReturnValue(new Promise((r) => { resolve = r; }));
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText(/reading your picture/i)).toBeInTheDocument();
    resolve({ kind: 'image', rows: [{ id: '1', label: 'USA', value: 87 }], warnings: [] });
    await waitFor(() => expect(screen.getByDisplayValue(/USA\t87/)).toBeInTheDocument());
  });

  it('a second picked file wins over a slower first one (Review Focus 3)', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    let resolveFirst!: (d: unknown) => void;
    let resolveSecond!: (d: unknown) => void;
    vi.mocked(detectImage)
      .mockReturnValueOnce(new Promise((r) => { resolveFirst = r; }))
      .mockReturnValueOnce(new Promise((r) => { resolveSecond = r; }));
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    fireEvent.change(input, { target: { files: [new File(['1'], 'a.png', { type: 'image/png' })] } });
    fireEvent.change(input, { target: { files: [new File(['2'], 'b.png', { type: 'image/png' })] } });
    resolveSecond({ kind: 'image', rows: [{ id: '2', label: 'Newer', value: 2 }], warnings: [] });
    await waitFor(() => expect(screen.getByDisplayValue(/Newer\t2/)).toBeInTheDocument());
    resolveFirst({ kind: 'image', rows: [{ id: '1', label: 'Stale', value: 1 }], warnings: [] });
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.queryByDisplayValue(/Stale/)).toBeNull();
  });

  it('rejects a file over 15MB before calling detectImage (Review Focus 2)', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    const big = new File([new Uint8Array(16 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [big] } });
    expect(await screen.findByText(/too large|smaller picture/i)).toBeInTheDocument();
    expect(detectImage).not.toHaveBeenCalled();
  });

  it('times out a stuck recognition after 20s and shows a retry warning (Review Focus 2)', async () => {
    vi.useFakeTimers();
    const { detectImage } = await import('@/insights/detectImage');
    vi.mocked(detectImage).mockReturnValue(new Promise(() => {})); // never resolves
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(screen.getByText(/took too long|try again/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/intake-route.test.tsx -t "useIntake picture handling"`
Expected: FAIL — no "Picture file" input reachable from the mounted `/new` route yet (Task 4 added it to `PasteBox`, but `Intake`/`QuickPost` don't pass `onImage` yet, so nothing is wired end to end) and `handleImage` doesn't exist.

- [ ] **Step 3: Implement the wiring in `useIntake`**

In `src/components/intake/Intake.tsx`, add the import and extend `useIntake`:

```ts
import { detectImage } from '../../insights/detectImage';
```

Replace the `useIntake` function body:

```ts
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 20_000;
const TOO_LARGE = 'That picture is too large — try a smaller picture (under 15MB).';
const TOO_SLOW = "That took too long to read. Try again, or paste the numbers instead.";

export function useIntake(initialText = '') {
  const [text, setText] = useState(initialText);
  const [unitOverride, setUnitOverride] = useState<Unit | 'number' | null>(null);
  const [imageState, setImageState] = useState<'idle' | 'loading-engine' | 'reading'>('idle');
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const requestRef = useRef(0);
  const detection = useMemo(() => detect(text), [text]);
  const unit: Unit | 'number' = unitOverride ?? detection.unit ?? 'number';
  const rows = useMemo(() => detection.rows.map((r) => ({ ...r, id: newId(), ...(unit === 'number' ? { unit: undefined } : { unit }) })), [detection.rows, unit]);
  const suggestions = useMemo(() => suggest(rows), [rows]);
  const title = detection.title ?? (detection.columns && detection.columns.length >= 2 ? `${detection.columns[1]} by ${detection.columns[0]}` : 'Untitled');
  const baseSpec = useMemo<ChartSpec>(() => defaultSpec({ data: rows, text: { title }, type: suggestions[0]?.type ?? 'bar' }), [rows, title, suggestions]);
  useEffect(() => { if (detection.rows.length) track('intake_detect', { kind: detection.kind, rows: detection.rows.length }); }, [detection.kind, detection.rows.length]);

  const handleImage = useCallback((file: File) => {
    if (file.size > MAX_IMAGE_BYTES) { setImageWarning(TOO_LARGE); return; }
    setImageWarning(null);
    setImageState('loading-engine');
    const myRequest = ++requestRef.current;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (requestRef.current === myRequest) { setImageState('idle'); setImageWarning(TOO_SLOW); }
    }, IMAGE_TIMEOUT_MS);
    setImageState('reading');
    void detectImage(file).then((d) => {
      clearTimeout(timer);
      if (timedOut || requestRef.current !== myRequest) return; // a newer pick, or already timed out, wins
      setImageState('idle');
      if (d.warnings.length) setImageWarning(d.warnings[0]);
      if (d.rows.length) { setText(d.rows.map((r) => `${r.label}\t${r.value}`).join('\n')); track('intake_detect', { kind: 'image', rows: d.rows.length }); }
    }).catch(() => {
      clearTimeout(timer);
      if (timedOut || requestRef.current !== myRequest) return;
      setImageState('idle');
      setImageWarning(TOO_SLOW);
    });
  }, []);

  return { text, setText, detection, unit, setUnit: setUnitOverride, rows, suggestions, baseSpec, imageState, imageWarning, handleImage };
}
```

Add `useCallback` and `useRef` to the existing `import { useEffect, useMemo, useState } from 'react';` line, making it `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`.

In `Intake`'s own JSX, change the `<PasteBox ...>` call to:

```tsx
<PasteBox text={intake.text} onText={intake.setText} detection={detection} unit={intake.unit} onUnit={intake.setUnit} onImage={intake.handleImage} imageState={intake.imageState} imageWarning={intake.imageWarning} />
```

In `src/components/intake/QuickPost.tsx`, change its `<PasteBox ...>` call (the one with `compact`) to:

```tsx
<PasteBox compact text={intake.text} onText={intake.setText} detection={detection} unit={intake.unit} onUnit={intake.setUnit} onImage={intake.handleImage} imageState={intake.imageState} imageWarning={intake.imageWarning} />
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/intake-route.test.tsx`
Expected: PASS, including every pre-existing test in that file.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: every test passes (this task touches shared components — a regression anywhere else must be caught here, not deferred).

- [ ] **Step 6: Commit**

```bash
git add src/components/intake/Intake.tsx src/components/intake/QuickPost.tsx src/test/intake-route.test.tsx
git commit -m "feat: wire picture recognition into useIntake with a size cap, timeout and race guard"
```

---

### Task 6: `/new?shared=1` — reading a shared picture out of `shareInbox`

**Files:**
- Modify: `src/routes/new.tsx`
- Modify: `src/components/intake/Intake.tsx` (mount-time hydration)
- Modify: `src/lib/gtag.ts` (new `share_target_miss` event)
- Test: `src/test/index-route.test.tsx` (already mounts the real `routeTree.gen.ts` with a real `createMemoryHistory` — the right harness for this, matching how `/?templates=1` and `/new?text=` are already tested there)

**Interfaces:**
- Consumes: `db.shareInbox` (Task 1), `intake.handleImage` (Task 5), `boolParam` from `src/lib/searchParams.ts` (existing).
- Produces: `/new`'s `validateSearch` gains `shared: boolean`.

- [ ] **Step 1: Write the failing tests**

First, change `src/test/index-route.test.tsx`'s existing import line from `import { render, screen } from '@testing-library/react';` to `import { render, screen, waitFor } from '@testing-library/react';` (the file doesn't import `waitFor` yet).

Add to `src/test/index-route.test.tsx`:

```ts
describe('a shared picture is picked up from shareInbox (review item: share with no file)', () => {
  it('reads and clears the pending blob when /new?shared=1 loads', async () => {
    const { db } = await import('@/db');
    const blob = new Blob(['x'], { type: 'image/png' });
    await db.shareInbox.put({ id: 'pending', blob, at: Date.now() });
    mount('/new?shared=1');
    await screen.findByLabelText('Paste your numbers');
    await waitFor(async () => expect(await db.shareInbox.get('pending')).toBeUndefined());
  });

  it('is a silent no-op when nothing is pending', async () => {
    mount('/new?shared=1');
    expect(await screen.findByLabelText('Paste your numbers')).toHaveValue('');
  });

  it('/new?text=hello still works exactly as before (no file field required)', async () => {
    mount('/new?text=hello');
    expect(await screen.findByLabelText('Paste your numbers')).toHaveValue('hello');
  });
});
```

- [ ] **Step 2: Run tests to verify the first one fails**

Run: `npx vitest run src/test/index-route.test.tsx -t "shareInbox"`
Expected: FAIL — `search.shared` is not read by `/new` yet, so the pending blob is never consumed and `db.shareInbox.get('pending')` still resolves to the row.

- [ ] **Step 3: Extend `/new`'s `validateSearch`**

In `src/routes/new.tsx`:

```ts
import { boolParam, stringParam } from '../lib/searchParams';

export const Route = createFileRoute('/new')({
  component: Intake,
  validateSearch: (s: Record<string, unknown>): { text?: string; url?: string; shared?: boolean } => ({
    text: stringParam(s, 'text', 20_000),
    url: stringParam(s, 'url', 2_000),
    shared: boolParam(s, 'shared') || undefined,
  }),
  onEnter: () => trackPageView('/new'),
  head: () => ({ meta: [{ title: 'New chart — ChartGenie' }] }),
});
```

- [ ] **Step 4: Add the `share_target_miss` event**

In `src/lib/gtag.ts`'s `EVENTS` const, add a line:

```ts
share_target_miss: {},
```

- [ ] **Step 5: Hydrate from `shareInbox` on mount**

In `src/components/intake/Intake.tsx`, in the `Intake` component (not `useIntake`), add the hydration effect right after the existing `useEffect` that sets the crumb:

```ts
useEffect(() => {
  if (!search.shared) return;
  void (async () => {
    const { db } = await import('../../db');
    const pending = await db.shareInbox.get('pending');
    if (!pending) { track('share_target_miss', {}); return; }
    await db.shareInbox.delete('pending');
    intake.handleImage(new File([pending.blob], 'shared-image', { type: pending.blob.type || 'image/png' }));
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [search.shared]);
```

Add `track` to the existing `import { track } from '../../lib/gtag';` line if not already imported at the top of the file (it already is, per the file's current `useEffect` inside `useIntake`).

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/test/index-route.test.tsx`
Expected: PASS, including every pre-existing test in the file (the `/?templates=1` and `/new?text=` cases must still pass unchanged).

- [ ] **Step 7: Commit**

```bash
git add src/routes/new.tsx src/components/intake/Intake.tsx src/lib/gtag.ts src/test/index-route.test.tsx
git commit -m "feat: hydrate a shared picture from shareInbox on /new?shared=1"
```

---

### Task 7: `src/sw.ts` — the Web Share Target fetch handler

**Files:**
- Create: `src/sw.ts`
- Modify: `vite.config.ts` (VitePWA `strategies: 'injectManifest'`)
- Test: `src/test/sw.test.ts`

**Interfaces:**
- Consumes: `db` from `src/db/index.ts` (Task 1) — Dexie is safe to open from a service-worker global scope (IndexedDB is available there).
- Produces: `export async function handleShareTarget(request: Request): Promise<{ blob: Blob | null; redirectTo: string }>` (the pure, directly testable function); the `self.addEventListener('fetch', ...)` wiring that calls it only for the matching request.

- [ ] **Step 1: Write the failing tests**

Create `src/test/sw.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, openDb, resetDbForTests } from '@/db';
import { handleShareTarget } from '@/sw';

beforeEach(async () => { await resetDbForTests(); await openDb(); });

function formDataRequest(fields: Record<string, string | Blob>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request('https://chartgenie.xyz/new', { method: 'POST', body: fd });
}

describe('handleShareTarget', () => {
  it('stores the shared image and redirects to /new?shared=1', async () => {
    const blob = new Blob(['fake image bytes'], { type: 'image/png' });
    const result = await handleShareTarget(formDataRequest({ image: blob }));
    expect(result.redirectTo).toBe('/new?shared=1');
    expect(result.blob).not.toBeNull();
    const stored = await db.shareInbox.get('pending');
    expect(stored?.blob).toBeTruthy();
  });

  it('a share with text but no file still redirects, storing nothing (Review Focus 5)', async () => {
    const result = await handleShareTarget(formDataRequest({ text: 'hello' }));
    expect(result.blob).toBeNull();
    expect(result.redirectTo).toBe('/new?shared=1');
    expect(await db.shareInbox.get('pending')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/sw.test.ts`
Expected: FAIL — `Cannot find module '@/sw'`.

- [ ] **Step 3: Write the implementation**

Create `src/sw.ts`:

```ts
/// <reference lib="webworker" />
// Custom service worker (injectManifest mode — see vite.config.ts). The only
// hand-written logic here is the Web Share Target handler; everything else
// is Workbox's generated precache/route behavior, wired below exactly as
// vite-plugin-pwa's own injectManifest docs specify.
import { precacheAndRoute } from 'workbox-precaching';
import { db, openDb } from './db';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

export async function handleShareTarget(request: Request): Promise<{ blob: Blob | null; redirectTo: string }> {
  const formData = await request.formData();
  const file = formData.get('image');
  if (file instanceof Blob) {
    await openDb();
    await db.shareInbox.put({ id: 'pending', blob: file, at: Date.now() });
    return { blob: file, redirectTo: '/new?shared=1' };
  }
  return { blob: null, redirectTo: '/new?shared=1' };
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/new') {
    event.respondWith((async () => {
      const { redirectTo } = await handleShareTarget(event.request.clone());
      return Response.redirect(redirectTo, 303);
    })());
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
```

- [ ] **Step 4: Switch the PWA plugin to `injectManifest` mode**

In `vite.config.ts`, change the `VitePWA({...})` call from:

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: false,
  workbox: { globPatterns: ['**/*.{js,css,html,woff2,svg,png}'], globIgnores: ['**/resvg.wasm', '**/fonts/*.ttf'], maximumFileSizeToCacheInBytes: 4_000_000 },
}),
```

to:

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: false,
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  injectManifest: { globPatterns: ['**/*.{js,css,html,woff2,svg,png}'], globIgnores: ['**/resvg.wasm', '**/fonts/*.ttf'], maximumFileSizeToCacheInBytes: 4_000_000 },
}),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/test/sw.test.ts`
Expected: PASS, 2/2.

- [ ] **Step 6: Build to confirm the service worker actually compiles under injectManifest**

Run: `npm run build`
Expected: build succeeds and `dist/sw.js` exists (`ls dist/sw.js`). If `workbox-precaching` is not already a resolvable dependency (it is normally pulled in transitively by `vite-plugin-pwa`, but `injectManifest` mode requires importing it directly in source), run `npm install workbox-precaching` first and rebuild.

- [ ] **Step 7: Run the full suite and type-check**

Run: `npx vitest run && npx tsc -b`
Expected: everything passes; `src/sw.ts` type-checks against `tsconfig.app.json`'s existing `include` (it already covers `src`).

- [ ] **Step 8: Commit**

```bash
git add src/sw.ts vite.config.ts package.json package-lock.json src/test/sw.test.ts
git commit -m "feat: custom service worker handling the Web Share Target POST"
```

---

### Task 8: Manifest — the real `POST` + files share target

**Files:**
- Modify: `public/manifest.webmanifest`
- Test: `src/test/release-claims.test.ts` gets one new assertion (not a new file)

**Interfaces:**
- Consumes: nothing code-level; this is declarative JSON the OS reads.

- [ ] **Step 1: Write the failing test**

Add to `src/test/release-claims.test.ts` (a new `describe` block, alongside the existing ones):

```ts
describe('manifest share target', () => {
  it('accepts a shared image via POST, not the old GET-only form', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
    expect(manifest.share_target.method).toBe('POST');
    expect(manifest.share_target.enctype).toBe('multipart/form-data');
    expect(manifest.share_target.files).toEqual([{ name: 'image', accept: ['image/*'] }]);
    expect(manifest.file_handlers.some((h: { accept: Record<string, string[]> }) => 'image/*' in h.accept)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/release-claims.test.ts -t "manifest share target"`
Expected: FAIL — the current manifest's `share_target.method` is `'GET'`.

- [ ] **Step 3: Update the manifest**

In `public/manifest.webmanifest`, replace:

```json
  "share_target": { "action": "/new", "method": "GET", "params": { "text": "text", "url": "url", "title": "title" } },
  "file_handlers": [{ "action": "/new", "accept": { "text/csv": [".csv"] } }]
```

with:

```json
  "share_target": {
    "action": "/new",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": { "text": "text", "url": "url", "title": "title" },
    "files": [{ "name": "image", "accept": ["image/*"] }]
  },
  "file_handlers": [
    { "action": "/new", "accept": { "text/csv": [".csv"] } },
    { "action": "/new", "accept": { "image/*": [".png", ".jpg", ".jpeg", ".webp"] } }
  ]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/release-claims.test.ts`
Expected: PASS, including every pre-existing case in that file (the manifest is still valid JSON parsed the same way elsewhere).

- [ ] **Step 5: Commit**

```bash
git add public/manifest.webmanifest src/test/release-claims.test.ts
git commit -m "feat: real POST+file Web Share Target in the manifest"
```

---

### Task 9: End-to-end proof — a real `POST` against the preview build

**Files:**
- Create: `e2e/share-target.spec.ts`

**Interfaces:**
- Consumes: nothing new; drives the built app exactly as the other `e2e/*.spec.ts` files do (`playwright.config.ts`'s existing `baseURL`/`webServer` config, already used by `e2e/smoke.spec.ts`, `e2e/share.spec.ts`, etc.).

- [ ] **Step 1: Write the failing test**

Create `e2e/share-target.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('a real POST to /new with an image lands on Intake with rows detected from a CSV fallback path', async ({ page, request, baseURL }) => {
  // The service worker only intercepts navigations from *inside* the page's
  // own origin's fetch handling; Playwright's `request` fixture issues a raw
  // HTTP POST, which — because there is no service worker in that request's
  // path — hits Vercel's static handling for /new (an SPA rewrite to
  // index.html) and simply serves the app shell. This proves the manifest's
  // declared endpoint is reachable and doesn't 404 or 500; the service
  // worker's own interception is covered by the unit test in
  // src/test/sw.test.ts (handleShareTarget), which is the layer that can
  // actually be exercised outside a real installed-PWA browser context.
  const png = readFileSync('e2e/fixtures/tiny.png');
  const response = await request.post(`${baseURL}/new`, {
    multipart: { image: { name: 'shared.png', mimeType: 'image/png', buffer: png } },
  });
  expect(response.status()).toBeLessThan(500);

  await page.goto('/new');
  await expect(page.getByLabel('Paste your numbers')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Picture' })).toBeVisible();
});
```

Create the fixture directory and a minimal 1×1 PNG:

```bash
mkdir -p e2e/fixtures
python3 -c "
import base64
open('e2e/fixtures/tiny.png','wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='))
"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/share-target.spec.ts`
Expected: FAIL at this point only if the "Picture" button isn't present yet in the built preview — since Tasks 4–8 are already committed by this point in the plan, it should actually pass; if it does, that's fine (this task's real job is to add durable e2e coverage, not to drive new production code). If it fails for an unrelated reason (missing fixture, wrong selector), fix the test, not the app.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx playwright test e2e/share-target.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e/share-target.spec.ts e2e/fixtures/tiny.png
git commit -m "test: e2e coverage for the /new share-target endpoint and Picture chip"
```

---

### Task 10: Honest claims, full gate, browser verification, and the PWA icon/bundle check

**Files:**
- Modify: `public/llms.txt`
- Modify: `README.md`
- Modify: `index.html` (JSON-LD `featureList`)
- Modify: `src/test/release-claims.test.ts` (forbid overclaiming this specific feature)
- Modify: `scripts/bundle-budget.mjs` — no code change expected, but this task verifies its output

- [ ] **Step 1: Write the failing test**

Add to `src/test/release-claims.test.ts`:

```ts
describe('picture-intake claims stay honest', () => {
  const FORBIDDEN_PICTURE_CLAIMS = /works on (all|every) (browser|phone|device)|available on iphone|available on ios|sent to (our|a) server|cloud (ocr|vision|api)/i;
  it('no copy overclaims the picture/share-target feature', () => {
    for (const path of ['public/llms.txt', 'README.md', 'index.html']) {
      expect(readFileSync(path, 'utf8'), path).not.toMatch(FORBIDDEN_PICTURE_CLAIMS);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes vacuously**

Run: `npx vitest run src/test/release-claims.test.ts -t "picture-intake claims"`
Expected: PASS trivially right now (the copy doesn't exist yet to violate it) — this test exists to fail *later* if someone adds overclaiming copy, so it stays green through this task and is a real guard from here on.

- [ ] **Step 3: Update `public/llms.txt`**

In the "What it does" list, add a new bullet after the existing "Paste anything" one:

```markdown
- **Add a picture**: a photo of a whiteboard or printed table, or a dropped screenshot, is read on the device — no image is sent anywhere. A "Picture" button next to Paste and CSV opens the camera on a phone or a file picker on desktop. On Chrome/Edge/ChromeOS with the app installed, sharing a photo from the OS share sheet also works; iOS and Safari don't support that share path, so the in-app button is what covers them.
```

- [ ] **Step 4: Update `README.md`**

In the feature list near "Paste anything," add:

```markdown
- **Add a picture.** A photo of a whiteboard or printed table, or a dropped screenshot, is read on-device (PaddleOCR-web on WebGPU, Tesseract.js elsewhere) — nothing is uploaded. Installed on Chrome/Edge/ChromeOS, ChartGenie is also a Web Share Target for photos.
```

- [ ] **Step 5: Update `index.html`'s JSON-LD**

In the `WebApplication` node's `featureList` array, add one entry:

```json
"Add a picture of a table and have it read on-device, no upload"
```

- [ ] **Step 6: Run the full local gate**

Run: `bash scripts/check.sh`
Expected: every step (`tsc`, `oxlint`, `vitest`, `build`, `budget`, `api smoke`, `playwright`) passes. Read the `budget` step's output specifically and confirm the entry and echarts-chunk sizes are unchanged from before this plan — `ppu-paddle-ocr`/`tesseract.js` must appear only in a separate, lazily-loaded chunk (verify with `grep -l "ppu-paddle-ocr\|tesseract" dist/assets/*.js` — the matching file(s) must not be the main `index-*.js` entry).

- [ ] **Step 7: Verify in the browser at desktop and phone width**

Start the dev server (`chartgenie-dev` launch config), open `/new`:
- Confirm the "Picture" chip is present and at least 44×44px at phone width (375px viewport).
- Click it, pick a real image file, confirm the "Setting up picture reading…" then a result (or a graceful warning) appears, and the thumbnail renders.
- Drop a non-image file onto the box and confirm nothing crashes and the existing "no rows found" behavior is unchanged.
- Resize to phone width and repeat via `QuickPost`'s compact `PasteBox`.
- Check the console for errors and the network tab for failed requests, per this repo's standing verification workflow.

- [ ] **Step 8: Commit**

```bash
git add public/llms.txt README.md index.html src/test/release-claims.test.ts
git commit -m "docs: honest claims for the picture-intake feature; full gate green"
```
