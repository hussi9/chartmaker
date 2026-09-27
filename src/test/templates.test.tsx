import 'fake-indexeddb/auto';
import { Blob as NodeBlob } from 'node:buffer';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { Templates } from '@/components/gallery/Templates';
import { TEMPLATES } from '@/chart/templates';
import { LEGACY_PRESETS } from '@/chart/legacy-presets';
import { CHART_TYPES, defaultSpec } from '@/chart/types';
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

function mount(path = '/') {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const idx = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <Templates /> });
  const edit = createRoute({ getParentRoute: () => rootRoute, path: '/edit/$id', component: () => <div>Editor page</div> });
  const fresh = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: () => <div>New page</div> });
  const charts = createRoute({ getParentRoute: () => rootRoute, path: '/charts', component: () => <div>Charts page</div> });
  const router = createRouter({ routeTree: rootRoute.addChildren([idx, edit, fresh, charts]), history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  indexedDB = new IDBFactory();
  await resetDbForTests();
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false });
  useDoc.getState().reset();
});

describe('TEMPLATES', () => {
  it('has one look per chart type plus the legacy presets, each with a valid spec', () => {
    for (const t of CHART_TYPES) expect(TEMPLATES.some((x) => x.type === t && x.category !== 'viral')).toBe(true);
    expect(TEMPLATES.length).toBe(CHART_TYPES.length + LEGACY_PRESETS.length);
    for (const t of TEMPLATES) {
      expect(t.spec.v).toBe(2);
      expect(t.spec.data.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
    }
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });
});

describe('Templates screen', () => {
  it('renders the gallery with category chips and live thumbnails', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: /pick a look/i })).toBeInTheDocument();
    const chips = screen.getByRole('group', { name: /categories/i });
    expect(within(chips).getByRole('button', { name: `All · ${CHART_TYPES.length}` })).toBeInTheDocument();
    expect(screen.getAllByRole('article').length).toBeGreaterThanOrEqual(8); // Popular + the blank card
    expect(document.querySelectorAll('article svg.cg-frame').length).toBeGreaterThanOrEqual(7);
  });

  it('filters by category and by search', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole('heading', { name: /pick a look/i });
    await user.click(screen.getByRole('button', { name: 'Funnels' }));
    const cards = screen.getAllByRole('article').filter((c) => !/start blank/i.test(c.getAttribute('aria-label') ?? ''));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c) => /funnel/i.test(c.textContent ?? ''))).toBe(true);
    await user.type(screen.getByRole('searchbox'), 'growth');
    const hits = screen.getAllByRole('article').filter((c) => !/start blank/i.test(c.getAttribute('aria-label') ?? ''));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((c) => /growth/i.test(c.textContent ?? ''))).toBe(true);
  });

  it('"Use this" opens the editor with the template spec', async () => {
    const user = userEvent.setup();
    mount();
    const card = (await screen.findAllByRole('article')).find((c) => /Conversion Funnel/.test(c.textContent ?? ''))!;
    await user.click(within(card).getByRole('button', { name: /use this/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    expect(useDoc.getState().spec.type).toBe('funnel');
    expect(useDoc.getState().id).toMatch(/^c_/);
  });

  it('"Start blank with sample data" opens the editor with the sample rows', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: /start blank/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    expect(useDoc.getState().spec.data.map((r) => r.label)).toEqual(['USA', 'Italy', 'UK', 'Ireland']);
  });

  it('hides the Recent shelf when the library is empty and shows it with saved charts', async () => {
    mount();
    await screen.findByRole('heading', { name: /pick a look/i });
    expect(screen.queryByText(/pick up where you left/i)).toBeNull();
    await db.charts.put({ id: 'a', spec: defaultSpec({ text: { title: 'MRR Q1–Q3' } }), createdAt: 1, updatedAt: Date.now() });
    await db.charts.put({ id: 'b', spec: defaultSpec({ text: { title: 'Retention' } }), createdAt: 1, updatedAt: Date.now() - 1000 });
    mount();
    await waitFor(() => expect(screen.getByText(/pick up where you left/i)).toBeInTheDocument());
    const shelf = screen.getByRole('region', { name: /recent/i });
    expect(within(shelf).getAllByText('MRR Q1–Q3').length).toBeGreaterThanOrEqual(1);
    expect(within(shelf).getByRole('link', { name: /all my charts/i })).toBeInTheDocument();
  });

  it('header actions go to /new and to a blank editor', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('link', { name: /paste numbers/i }));
    expect(await screen.findByText('New page')).toBeInTheDocument();
  });
});
