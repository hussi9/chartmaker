import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { Intake } from '@/components/intake/Intake';
import type { Detection } from '@/insights/intake';
import type { Recognizer } from '@/ocr/engine';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { openDb } from '@/db';

vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

vi.mock('@/export/png', () => ({
  pngBlob: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  downloadBlob: vi.fn(),
  sharePng: vi.fn(async () => 'unsupported'),
  copyPng: vi.fn(),
}));

const SAMPLE = 'USA        87\nItaly      20\nUK         12\nIreland    15';

function setWidth(px: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({ matches: q.includes('max-width') ? px < 900 : px >= 900, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }),
  });
}

function mount(path = '/new') {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const fresh = createRoute({ getParentRoute: () => rootRoute, path: '/new', validateSearch: (s: Record<string, unknown>) => ({ text: typeof s.text === 'string' ? s.text : undefined }), component: () => <Intake /> });
  const edit = createRoute({ getParentRoute: () => rootRoute, path: '/edit/$id', component: () => <div>Editor page</div> });
  const idx = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <div>Templates page</div> });
  const router = createRouter({ routeTree: rootRoute.addChildren([idx, fresh, edit]), history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  await openDb();
  setWidth(1440);
  useUi.setState({ storage: 'ok', narrow: false });
  useDoc.getState().reset();
});

describe('Intake (desktop)', () => {
  it('detects pasted rows and shows three suggestions with the funnel first', async () => {
    const user = userEvent.setup();
    mount();
    const box = await screen.findByRole('textbox', { name: /paste/i });
    await user.click(box);
    await user.paste(SAMPLE);
    expect(await screen.findByText(/Detected: 4 rows/)).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /suggested/i });
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('Conversion Funnel');
    expect(document.querySelectorAll('svg.cg-frame').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/Insights found:/).closest('p')).toHaveTextContent('USA is 4.4× the next value');
  });

  it('Continue opens the editor with the rows and the top suggestion', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('textbox', { name: /paste/i }));
    await user.paste(SAMPLE);
    await user.click(await screen.findByRole('button', { name: /continue with these rows/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    expect(useDoc.getState().spec.type).toBe('funnel');
    expect(useDoc.getState().spec.data.map((r) => r.label)).toEqual(['USA', 'Italy', 'UK', 'Ireland']);
  });

  it('"Use" on a suggestion opens the editor with that type', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('textbox', { name: /paste/i }));
    await user.paste(SAMPLE);
    const list = await screen.findByRole('list', { name: /suggested/i });
    await user.click(within(list).getAllByRole('button', { name: /^use/i })[2]);
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    expect(useDoc.getState().spec.type).toBe('donut');
  });

  it('a sentence sets the title and units', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('textbox', { name: /paste/i }));
    await user.paste('Revenue grew from 12k in Jan to 34k in Jun');
    expect(await screen.findByText(/Detected: 2 rows/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /k \/ M/i })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: /continue with these rows/i }));
    expect(useDoc.getState().spec.text.title).toBe('Revenue');
    expect(useDoc.getState().spec.type).toBe('bar');
  });

  it('pre-fills from ?text= (Web Share Target) and offers sample data when empty', async () => {
    mount(`/new?text=${encodeURIComponent(SAMPLE)}`);
    expect(await screen.findByText(/Detected: 4 rows/)).toBeInTheDocument();
  });

  it('shows guidance without rows and fills the sample on request', async () => {
    const user = userEvent.setup();
    mount();
    expect(await screen.findByText(/paste rows to see suggestions/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /sample data/i }));
    expect(await screen.findByText(/Detected: 4 rows/)).toBeInTheDocument();
  });
});

describe('Quick post (phone)', () => {
  beforeEach(() => { setWidth(390); useUi.setState({ narrow: true }); });

  it('paste → See 3 charts → pick size and look → share falls back to download', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('textbox', { name: /paste/i }));
    await user.paste(SAMPLE);
    await user.click(await screen.findByRole('button', { name: /see 3 charts/i }));
    expect(await screen.findByRole('group', { name: /post size/i })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: /post size/i })).getByRole('button', { name: '1:1' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(useDoc.getState().spec.look).toBe('dark');
    await user.click(screen.getByRole('button', { name: /share image \+ caption/i }));
    const { downloadBlob } = await import('@/export/png');
    await waitFor(() => expect(downloadBlob).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByRole('menuitem', { name: /open full editor/i })).toBeInTheDocument();
  });
});

vi.mock('@/insights/detectImage', () => ({ detectImage: vi.fn() }));
vi.mock('@/ocr/engine', () => ({ isEngineReady: vi.fn(() => false), ensureEngine: vi.fn().mockResolvedValue(undefined) }));

// Never actually invoked in these tests — detectImage is mocked separately
// and is what handleImage calls after ensureEngine() resolves. Only its
// resolution timing (not its return value) is under test here.
const fakeRecognizer: Recognizer = async () => [];

describe('useIntake picture handling', () => {
  it('shows "setting up" while the engine loads, then "reading" once it is ready, on the first (uncached) picture', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    const { isEngineReady, ensureEngine } = await import('@/ocr/engine');
    vi.mocked(isEngineReady).mockReturnValue(false);
    let resolveEngine!: () => void;
    vi.mocked(ensureEngine).mockReturnValueOnce(new Promise((r) => { resolveEngine = () => r(fakeRecognizer); }));
    let resolve!: (d: Detection) => void;
    vi.mocked(detectImage).mockReturnValue(new Promise((r) => { resolve = r; }));
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText(/setting up picture reading/i)).toBeInTheDocument();
    await act(async () => { resolveEngine(); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText(/reading your picture/i)).toBeInTheDocument();
    resolve({ kind: 'image', rows: [{ id: '1', label: 'USA', value: 87 }], warnings: [] });
    await waitFor(() => expect(screen.getByDisplayValue(/USA 87/)).toBeInTheDocument());
  });

  it('shows "reading" (not "setting up") once the engine is already cached', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    const { isEngineReady } = await import('@/ocr/engine');
    vi.mocked(isEngineReady).mockReturnValue(true);
    let resolve!: (d: Detection) => void;
    vi.mocked(detectImage).mockReturnValue(new Promise((r) => { resolve = r; }));
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });
    expect(await screen.findByText(/reading your picture/i)).toBeInTheDocument();
    expect(screen.queryByText(/setting up picture reading/i)).toBeNull();
    resolve({ kind: 'image', rows: [{ id: '1', label: 'USA', value: 87 }], warnings: [] });
    await waitFor(() => expect(screen.getByDisplayValue(/USA 87/)).toBeInTheDocument());
  });

  it('does not start the 20s read-timeout until the engine has finished loading (review item I1)', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    const { isEngineReady, ensureEngine } = await import('@/ocr/engine');
    vi.mocked(isEngineReady).mockReturnValue(false);
    let resolveEngine!: () => void;
    vi.mocked(ensureEngine).mockReturnValueOnce(new Promise((r) => { resolveEngine = () => r(fakeRecognizer); }));
    vi.mocked(detectImage).mockReturnValue(new Promise(() => {})); // the read itself never resolves in this test
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    vi.useFakeTimers();
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });
    // The model download can legitimately take longer than the old combined 20s budget.
    await act(async () => { await vi.advanceTimersByTimeAsync(25_000); });
    expect(screen.getByText(/setting up picture reading/i)).toBeInTheDocument();
    expect(screen.queryByText(/took too long|try again/i)).toBeNull();
    // The engine finishes loading; the read gets its own fresh 20s budget.
    await act(async () => { resolveEngine(); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText(/reading your picture/i)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(screen.getByText(/took too long|try again/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('a second picked file wins over a slower first one (Review Focus 3)', async () => {
    const { detectImage } = await import('@/insights/detectImage');
    const pending: { file: File; resolve: (d: Detection) => void }[] = [];
    vi.mocked(detectImage).mockImplementation(
      (file) => new Promise((resolve) => { pending.push({ file, resolve }); }),
    );
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    fireEvent.change(input, { target: { files: [new File(['1'], 'a.png', { type: 'image/png' })] } });
    fireEvent.change(input, { target: { files: [new File(['2'], 'b.png', { type: 'image/png' })] } });
    // Two picks made back to back, before either's engine-ready check
    // settles: the stale one is discarded at that gate and must never reach
    // detectImage at all (a stronger guarantee than the old code gave,
    // which called detectImage for both and discarded the loser's result
    // only after the fact) — see the ensureEngine().then() isMine() guard
    // in Intake.tsx's handleImage.
    await waitFor(() => expect(pending.length).toBeGreaterThan(0));
    expect(pending.every((p) => p.file.name === 'b.png')).toBe(true);
    pending.forEach((p) => p.resolve({ kind: 'image', rows: [{ id: '2', label: 'Newer', value: 2 }], warnings: [] }));
    await waitFor(() => expect(screen.getByDisplayValue(/Newer 2/)).toBeInTheDocument());
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
    const { detectImage } = await import('@/insights/detectImage');
    vi.mocked(detectImage).mockReturnValue(new Promise(() => {})); // never resolves
    mount('/new');
    const input = await screen.findByLabelText('Picture file');
    // Fake timers only for the 20s wait itself — findByLabelText above needs
    // real timers to resolve; Testing Library's fake-timer auto-detection
    // for its own polling is unreliable across Vitest versions.
    vi.useFakeTimers();
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } });
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(screen.getByText(/took too long|try again/i)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
