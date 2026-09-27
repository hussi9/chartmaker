import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { MyCharts } from '@/components/charts/MyCharts';
import { defaultSpec } from '@/chart/types';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { db, openDb, resetDbForTests } from '@/db';

globalThis.Blob = NodeBlob as unknown as typeof Blob;

vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

vi.mock('@/export/png', () => ({ downloadBlob: vi.fn(), pngBlob: vi.fn(), copyPng: vi.fn(), sharePng: vi.fn() }));

function mount(path = '/charts') {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const charts = createRoute({ getParentRoute: () => rootRoute, path: '/charts', component: () => <MyCharts /> });
  const edit = createRoute({ getParentRoute: () => rootRoute, path: '/edit/$id', component: () => <div>Editor page</div> });
  const fresh = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: () => <div>New page</div> });
  const idx = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <div>Templates page</div> });
  const router = createRouter({ routeTree: rootRoute.addChildren([idx, charts, edit, fresh]), history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

const DAY = 86_400_000;

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false, toasts: [] });
  useDoc.getState().reset();
});

async function seed() {
  await db.charts.put({ id: 'a', spec: defaultSpec({ text: { title: 'Countries' } }), createdAt: 1, updatedAt: Date.now() - 120_000, sharedAt: Date.now() - 60_000, sharedUrl: 'https://chartgenie.xyz/s/abc' });
  await db.charts.put({ id: 'b', spec: defaultSpec({ text: { title: 'MRR Q1–Q3' }, size: '1:1' }), createdAt: 1, updatedAt: Date.now() - DAY });
}

describe('MyCharts', () => {
  it('shows the empty state with a way to start', async () => {
    mount();
    expect(await screen.findByText(/no charts yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pick a look/i })).toBeInTheDocument();
  });

  it('lists saved charts newest first with size, time and shared status', async () => {
    await seed();
    mount();
    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Countries');
    expect(cards[0]).toHaveTextContent('16:9');
    expect(cards[0]).toHaveTextContent(/2 min ago/);
    expect(cards[0]).toHaveTextContent(/shared/);
    expect(cards[1]).toHaveTextContent('1:1');
    expect(cards[1]).toHaveTextContent(/yesterday/);
    expect(screen.getByText(/Saved in this browser/)).toBeInTheDocument();
  });

  it('filters: Shared shows only shared charts; a size chip narrows further', async () => {
    const user = userEvent.setup();
    await seed();
    mount();
    await screen.findAllByRole('article');
    await user.click(screen.getByRole('button', { name: /shared · 1/i }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /all · 2/i }));
    await user.click(screen.getByRole('button', { name: '1:1' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('MRR');
  });

  it('Open loads the chart into the editor', async () => {
    const user = userEvent.setup();
    await seed();
    mount();
    const [card] = await screen.findAllByRole('article');
    await user.click(within(card).getByRole('link', { name: /open/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
  });

  it('Duplicate creates "<title> copy" and opens it', async () => {
    const user = userEvent.setup();
    await seed();
    mount();
    const [card] = await screen.findAllByRole('article');
    await user.click(within(card).getByRole('button', { name: /duplicate/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    expect(useDoc.getState().spec.text.title).toBe('Countries copy');
    expect(await db.charts.count()).toBe(3);
  });

  it('Delete removes with an undo toast that restores', async () => {
    const user = userEvent.setup();
    await seed();
    mount();
    const [card] = await screen.findAllByRole('article');
    await user.click(within(card).getByRole('button', { name: /more/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(await db.charts.count()).toBe(1);
    await user.click(screen.getByRole('button', { name: /undo/i }));
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
    expect(await db.charts.count()).toBe(2);
  });

  it('lists copied share links with a Copy action', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await seed();
    mount();
    const table = await screen.findByRole('table', { name: /shared links/i });
    expect(within(table).getByText('https://chartgenie.xyz/s/abc')).toBeInTheDocument();
    await user.click(within(table).getByRole('button', { name: /copy/i }));
    expect(write).toHaveBeenCalledWith('https://chartgenie.xyz/s/abc');
    write.mockRestore();
  });

  it('offers "Duplicate last month" only when a chart is older than 28 days', async () => {
    await seed();
    mount();
    await screen.findAllByRole('article');
    expect(screen.queryByText(/duplicate last month/i)).toBeNull();
    await db.charts.put({ id: 'old', spec: defaultSpec({ text: { title: 'Hiring plan' } }), createdAt: 1, updatedAt: Date.now() - 40 * DAY });
    mount();
    expect(await screen.findByText(/duplicate last month/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /duplicate “hiring plan”/i })).toBeInTheDocument();
  });

  it('backup export triggers a download and restore reads a file', async () => {
    const user = userEvent.setup();
    await seed();
    mount();
    await screen.findAllByRole('article');
    await user.click(screen.getByRole('button', { name: /export a backup/i }));
    const { downloadBlob } = await import('@/export/png');
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), expect.stringMatching(/chartgenie-backup-.*\.json/));
    const input = screen.getByLabelText(/restore/i) as HTMLInputElement;
    const file = new File([JSON.stringify({ version: 1, charts: [{ id: 'z', spec: defaultSpec({ text: { title: 'Restored' } }), createdAt: 1, updatedAt: 1 }], series: [], brand: null, settings: null })], 'b.json', { type: 'application/json' });
    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: /merge the backup/i }));
    await waitFor(async () => expect(await db.charts.count()).toBe(3));
  });
});
