# Picture intake — design spec

Date: 2026-09-27 · Branch: TBD (cut from `main` at time of planning) · Depends on: `docs/superpowers/specs/2026-09-27-chartgenie-redesign-design.md` (the shipped v3.0.1 app)

Inputs: this conversation's brainstorming (spike results below), the existing `src/insights/intake.ts` pipeline, the existing `src/components/intake/PasteBox.tsx` UI, the existing Dexie schema (`src/db/index.ts`, v1) and PWA setup (`vite-plugin-pwa`, `generateSW`, no custom service worker code today).

## 1. Product statement

Add a fourth way to get numbers into ChartGenie: a picture. Someone photographs a whiteboard, a printed report, a receipt, or drops a screenshot of a spreadsheet, and ChartGenie reads the table out of it — on the device, for free, the same way pasted text already works. This is explicitly an ease-of-use and virality lever ("snap it, get a chart"), not a new product pillar.

### Decisions taken (owner approved during brainstorming, 2026-09-27)

| Decision | Choice | Reason |
|---|---|---|
| Extraction | On-device only for v1. No cloud vision API, no server call, no new API key. | Verified by spike (§2): near-perfect accuracy on realistic test images, ~100–450ms per image, one-time cached model download of 4–11 MB. Preserves the "nothing leaves your browser" promise this app is built and tested around. Cloud fallback stays a deferred idea, revisited only if real usage shows on-device genuinely failing — not built speculatively. |
| Engine | Try `ppu-paddle-ocr` (PaddleOCR PP-OCRv6-tiny, ONNX Runtime Web, WebGPU) first when `navigator.gpu` exists; fall back to `tesseract.js` (WASM, no GPU needed) everywhere else. | PaddleOCR-web was faster and equally accurate in testing; Tesseract.js is the universal fallback for Safari and browsers without WebGPU. Both are real, maintained npm packages (`ppu-paddle-ocr@6.6.0`, `tesseract.js@7.0.0`), not hypothetical. |
| Where it lives | A fourth chip, "Picture," in `PasteBox` next to Cells / Sentence / CSV — shared by desktop Intake and mobile QuickPost, which already render the same component. | Matches how "CSV" already behaves (a chip that opens a file picker, not a text-mode toggle); no new UI chrome invented. |
| Camera | File input uses `capture="environment"` so phones open the camera directly, not a gallery picker. | The core "walk up to a whiteboard, snap it" flow. |
| Output | Recognized lines are joined into text and run through the existing `detect()` pipeline — the OCR module's only job is image → text lines. | Reuses the entire proven row-confirmation UI (`Detected: N rows`, editing, unit control, warnings) instead of building a parallel one. Nothing charts silently; the person always confirms rows first, same as every other intake path. |
| Share target | Yes — a real `POST` + file Web Share Target, so a photo shared from the OS share sheet lands directly in ChartGenie. | Approved explicitly; the clearer virality lever of the two entry points. Requires switching the PWA from Workbox's auto-generated service worker to a hand-written one (`injectManifest`) — the first custom service-worker code in this app. Honest caveat: Web Share Target with files is Chrome/Edge/ChromeOS-only and only fires for an installed PWA; iOS and desktop Safari never get it. The in-app camera chip is what covers everyone else and is the one that matters most. |
| Storage handoff | A new Dexie table, `shareInbox`, in the existing `chartgenie` database (schema bump to v2), not a separate hand-rolled IndexedDB. | One storage system, consistent with how brand logos and chart thumbnails already store blobs. |

Dropped for v1, on purpose: cloud vision fallback, a progress percentage for the model download (indeterminate spinner + text is enough), multi-image intake, PDF intake, cropping/rotation tools before recognition (if the shot is bad, retake it — this is a phone-first flow).

## 2. Spike evidence (already run, not to repeat)

Ran three synthetic test images — a clean spreadsheet screenshot, a rotated/blurred photo of a printed table, and a handwriting-style whiteboard table — through both engines via their real published packages, driven headlessly with Playwright against a live public benchmark harness (not simulated).

| | Clean screenshot | Rotated/blurred photo | Handwriting-style |
|---|---|---|---|
| PaddleOCR-web (WebGPU) | 100% correct | 100% correct | 100% correct |
| Tesseract.js (WASM) | 100% correct | 100% correct, one stray character | 100% correct |
| Predict time | 80–230ms | 80–120ms | 85–90ms |

Model weight (one-time, cached by the browser after first download): PaddleOCR-web ≈ 6.1 MB of ONNX weights (PP-OCRv6-tiny detection + recognition) + 4.8 MB `onnxruntime-web` WASM runtime ≈ **10.9 MB**. Tesseract.js ≈ 2.8 MB trained-data + 1.3 MB core WASM ≈ **4.1 MB**. Both lazy-loaded only when a picture is actually used — zero cost to everyone who never touches this feature, and zero change to the existing bundle-budget numbers.

Caveat carried forward honestly: the handwriting test used a neat cursive **web font**, not real messy human handwriting — a best-case proxy. Real photos of genuinely sloppy handwriting, poor lighting, or heavy glare will do worse than this table suggests. That is exactly why on-device-with-confirmation is the right v1 shape: the person reviews the rows before anything charts, so a bad read costs a retake, not a wrong chart.

## 3. Components

### 3.1 `src/ocr/engine.ts` (new)
- `recognizeImage(file: File): Promise<string[]>` — the only export other modules call. Returns recognized text, one array entry per detected line, reading order top-to-bottom.
- Internally: feature-detects `'gpu' in navigator`; lazy-imports and initializes `ppu-paddle-ocr` on that path, `tesseract.js` otherwise. The initialized engine is cached module-level for the rest of the session (first call pays the model download and init cost; later calls in the same visit are fast).
- Never imported by the main bundle or by any route's eagerly-loaded chunk — only reached via dynamic `import()` from the picture-intake code path, so it never touches `scripts/bundle-budget.mjs`'s entry/echarts-chunk numbers.

### 3.2 `src/insights/detectImage.ts` (new)
- `detectImage(file: File): Promise<Detection>` = `recognizeImage(file)` → join lines with `\n` → `detect(joinedText)` (the existing function in `src/insights/intake.ts`, unchanged).
- This is the entire integration surface with the existing intake pipeline. `MAX_INTAKE_ROWS` (500) and every existing `fromTable`/`fromLines` rule apply automatically; no parallel row-parsing logic is written for images.

### 3.3 `src/components/intake/PasteBox.tsx` (modified)
- Fourth chip, "Picture," alongside Cells / Sentence / CSV. Click opens `<input type="file" accept="image/*" capture="environment" hidden>`, mirroring the existing CSV file input.
- `onDrop` gains an image-file branch (checks `file.type.startsWith('image/')`) alongside the existing CSV branch, so dropping a screenshot into the box works exactly like dropping a `.csv` does today.
- New local state for the picture path only: `'idle' | 'loading-engine' | 'reading'`, and a small thumbnail (`URL.createObjectURL(file)`, revoked on replace/unmount) shown next to the `Detected: N rows` banner once a picture has been read, so the person can eyeball the source against the result.
- Copy for each state: `loading-engine` → "Setting up picture reading… (one-time, a few MB)"; `reading` → "Reading your picture…"; a failed/empty detection reuses the existing `detection.warnings` line with picture-specific text: "Couldn't find a clear table in that picture. Try a straighter, better-lit shot, or paste the numbers instead."

### 3.4 `src/components/intake/Intake.tsx` / `useIntake` (modified)
- The "handle a picked image file" logic (call `detectImage`, manage loading state, set `text`) lives once in `useIntake` so both the manual chip (desktop Intake and mobile QuickPost, which already share `PasteBox`) and the share-target hydration path (§3.6) call the same function — no duplicated wiring.

### 3.5 `src/sw.ts` (new)
- First custom service worker code in this app. `vite.config.ts`'s `VitePWA` config switches from the implicit `generateSW` default to `strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts'`.
- Exports a pure, directly-testable function — `handleShareTarget(request: Request): Promise<{ blob: Blob | null; redirectTo: string }>` — separate from the `self.addEventListener('fetch', ...)` wiring that calls it. The wiring only intercepts requests matching `request.method === 'POST' && new URL(request.url).pathname === '/new'`; every other request still goes through the normal Workbox-generated precache/route handling (`precacheAndRoute(self.__WB_MANIFEST)`), which this file must call itself now that Workbox no longer generates it automatically.
- `handleShareTarget` reads `await request.formData()`, pulls the `image` field, opens the Dexie `chartgenie` database (same one the app uses — Dexie is safe to open from a service-worker context) and writes `db.shareInbox.put({ id: 'pending', blob: file, at: Date.now() })`. Returns a redirect target of `/new?shared=1`.

### 3.6 `src/routes/new.tsx` (modified)
- `validateSearch` gains `shared: boolean`, built with the existing `boolParam` helper from `src/lib/searchParams.ts` (the exact fix from the Templates/share-text regression — reusing it here instead of re-deriving a new boolean-param comparison is deliberate).
- On mount, if `search.shared`, `Intake`/`QuickPost` read `db.shareInbox.get('pending')`, delete it immediately (so a refresh never reprocesses a stale share), and — if a blob was actually there — feed it through the same handler as §3.4. Nothing found is a silent no-op: the screen just renders normally.

### 3.7 `src/db/index.ts` (modified)
- `this.version(2).stores({ ...v1 stores unchanged..., shareInbox: 'id' })`. Purely additive; Dexie handles this without a migration function. `ShareInboxDoc { id: 'pending'; blob: Blob; at: number }`.

### 3.8 `public/manifest.webmanifest` (modified)
- `share_target` replaced with the `POST` + `files` form shown in §1's decision table. `file_handlers` gains an `image/*` entry alongside the existing `text/csv` one, so "Open with ChartGenie" on an image file (desktop file-association style) also works — same handler as the share target, secondary entry point, no new code.

## 4. Data flow

```
Manual chip / drop           OS share sheet (Chrome/Android, installed PWA only)
        │                                   │
        ▼                                   ▼
  <input type=file>                   POST /new (multipart)
        │                                   │
        │                          src/sw.ts fetch handler
        │                          → shareInbox.put(blob)
        │                          → 303 redirect /new?shared=1
        │                                   │
        └──────────────┬────────────────────┘
                        ▼
              detectImage(file)
           (src/insights/detectImage.ts)
                        │
              recognizeImage(file)
              (src/ocr/engine.ts — WebGPU
               PaddleOCR or WASM Tesseract)
                        │
              string[] of recognized lines
                        │
                 detect(lines.join('\n'))
              (existing src/insights/intake.ts,
               unchanged)
                        │
                        ▼
         Detection { rows, warnings, … }
                        │
        same PasteBox "Detected: N rows" banner,
        row editing, suggestion cards — unchanged
```

## 5. Error handling

| Failure | Behaviour |
|---|---|
| Model download fails (offline, blocked request) | "Couldn't set up picture reading — check your connection and try again." Chip returns to idle; nothing else in the app is affected. |
| Recognition runs but finds no usable rows | Existing empty-detection UI plus the picture-specific hint in §3.3. The picked file and its thumbnail stay visible so the person isn't starting over blind. |
| `navigator.gpu` present but WebGPU init throws (driver issue) | Caught, falls back to Tesseract.js silently — the person never sees a WebGPU-specific error, just a possibly-slower read. |
| Service worker never ran (Safari, not installed, browser cleared the SW) | `shareInbox` has nothing under `'pending'`; `/new?shared=1` renders as an ordinary empty Intake screen. No error state — a share that silently didn't arrive is confusing, so this should also be logged as a gtag event (`share_target_miss`, no content) for visibility, not surfaced to the person as a dead end. |
| Two shares in quick succession | Second `put()` with the same fixed `id: 'pending'` overwrites the first — last one wins, matching how someone would expect "the thing I most recently shared" to behave. |

## 6. Claims and copy

Every one of these needs updating to stay true, following the same discipline `release-claims.test.ts` already enforces:
- `public/llms.txt` and `README.md` — add the picture path to "What it does," stating plainly that recognition runs on-device (model download noted) and that photo-sharing from the OS is Chrome/Android/installed-PWA only.
- `index.html` JSON-LD `featureList` — one new line.
- `release-claims.test.ts`'s forbidden-phrase list gets an explicit new case: nothing in this feature's copy may claim cross-browser share-target support or imply cloud processing.

## 7. Testing

- `src/insights/detectImage.ts` — unit tests with a fake `recognizeImage` (mocked, since the real engines are multi-MB downloads not fit for the unit suite) feeding known line arrays through `detect()`, confirming the row/warning contract.
- `src/ocr/engine.ts` — a thin, mostly-untested integration seam by design (real model behavior is what the spike already verified against real packages); tests cover the WebGPU/WASM branch selection logic with `navigator.gpu` mocked present/absent, not actual inference.
- `src/sw.ts` — `handleShareTarget` unit-tested directly as a plain function (construct a `Request` with a `FormData` body, assert the returned blob and redirect target), per §3.5's testable-function-separate-from-wiring split.
- `PasteBox`/`Intake` — component tests for the new chip, the drop branch, and the loading/thumbnail/warning states, following the existing patterns in `src/test/intake.test.ts` and `src/test/datagrid.test.tsx`.
- One new Playwright e2e (`e2e/share-target.spec.ts`) drives a real `POST /new` against the preview build (matching the existing pattern of testing against `BASE_URL`) and confirms the redirect plus row population — the one place this feature is proven against a real browser and a real service worker rather than mocks.
- `scripts/check.sh` gains nothing new structurally; the new tests run inside the existing `vitest`/`playwright` steps.

## 8. Global constraints (carried from the standing rules; every task below implicitly includes these)

- No mock or demo data presented as real; the picture path either reads a real image or shows a real failure state, never a canned "example" result.
- Nothing deleted — the old GET-only `share_target` and `file_handlers` entries are replaced in place (git history keeps the old version; no `.archive/` need for a one-line manifest change).
- 44px minimum tap targets on the new chip and any new controls, verified in the browser at desktop and phone width before calling any task done, per the standing UI rule.
- No Google Fonts, no hosted CI, `scripts/check.sh` stays the only gate.
- Every claim in copy must be true of the shipped code (§6).
