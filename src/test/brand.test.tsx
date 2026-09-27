import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { Brand } from '@/components/brand/Brand';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { db, openDb, resetDbForTests } from '@/db';
import { OKABE_ITO } from '@/chart/cvd';

globalThis.Blob = NodeBlob as unknown as typeof Blob;

vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

function mount() {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const brand = createRoute({ getParentRoute: () => rootRoute, path: '/brand', component: () => <Brand /> });
  const router = createRouter({ routeTree: rootRoute.addChildren([brand]), history: createMemoryHistory({ initialEntries: ['/brand'] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false, toasts: [], handle: undefined });
  useDoc.getState().reset();
});

describe('Brand screen', () => {
  it('starts from the Signal palette with a handle field and the fixed type pair', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: /my brand/i })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: /colour \d/i })).toHaveLength(4);
    expect(screen.getByText('Bricolage Grotesque')).toBeInTheDocument();
    expect(screen.getByText('Geist')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /handle/i })).toBeInTheDocument();
    expect(screen.getByText('Saved in this browser.')).toBeInTheDocument();
  });

  it('edits a swatch, adds and removes swatches, and persists', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: /my brand/i });
    await user.click(screen.getByRole('button', { name: /add colour/i }));
    expect(screen.getAllByRole('textbox', { name: /colour \d/i })).toHaveLength(5);
    await user.click(screen.getAllByRole('button', { name: /remove colour/i })[4]);
    expect(screen.getAllByRole('textbox', { name: /colour \d/i })).toHaveLength(4);
    const first = screen.getByRole('textbox', { name: /colour 1/i });
    await user.clear(first);
    await user.type(first, '#123456');
    await waitFor(async () => expect((await db.brand.get('brand'))?.palette[0]).toBe('#123456'));
  });

  it('shows the colour-blind preview and the safe toggle swaps the palette', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: /my brand/i });
    expect(screen.getByRole('group', { name: /colour-blind preview/i })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: /colour-blind-safe palette/i }));
    await waitFor(async () => expect((await db.brand.get('brand'))?.safe).toBe(true));
    const safeRow = screen.getByRole('group', { name: /safe palette/i });
    expect(within(safeRow).getAllByRole('img').length).toBeGreaterThan(0);
    for (const sw of within(safeRow).getAllByRole('img')) expect(OKABE_ITO).toContain(sw.getAttribute('data-color'));
  });

  it('handle writes settings and the rail; corner and apply-to-new persist', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: /my brand/i });
    await user.type(screen.getByRole('textbox', { name: /handle/i }), 'ada');
    await waitFor(() => expect(useUi.getState().handle).toBe('ada'));
    await waitFor(async () => expect((await db.settings.get('settings'))?.handle).toBe('ada'));
    await user.click(screen.getByRole('radio', { name: /top left/i }));
    await user.click(screen.getByRole('switch', { name: /apply to every new chart/i }));
    await waitFor(async () => expect(await db.brand.get('brand')).toMatchObject({ corner: 'tl', applyToNew: true }));
  });

  it('rejects a logo over 200 KB and stores a small one', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: /my brand/i });
    const input = screen.getByLabelText(/logo file/i) as HTMLInputElement;
    const big = new File([new Uint8Array(250_000)], 'big.png', { type: 'image/png' });
    await user.upload(input, big);
    expect(await screen.findByText(/200 KB/)).toBeInTheDocument();
    const small = new File([new Uint8Array(1_000)], 'logo.png', { type: 'image/png' });
    await user.upload(input, small);
    await waitFor(async () => expect((await db.brand.get('brand'))?.logo).toBeDefined());
  });

  it('a new doc picks up the brand when apply-to-new is on', async () => {
    await db.brand.put({ id: 'brand', palette: ['#010101', '#020202'], safe: false, handle: 'ada', corner: 'br', applyToNew: true });
    const { brandForNewDoc } = await import('@/chart/cvd');
    const spec = await brandForNewDoc(useDoc.getState().spec);
    expect(spec.palette).toEqual(['#010101', '#020202']);
    expect(spec.options.handle).toBe('ada');
  });
});
