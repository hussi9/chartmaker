import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createRouter, createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { openDb, resetDbForTests } from '@/db';
import { useUi } from '@/store/ui';
import { routeMetadata } from '@/lib/routeMetadata';

// Landing renders a live example chart via echarts, which needs a real
// canvas/DOM environment it doesn't get in jsdom — same stub used by the
// other route-mounting tests (index-route.test.tsx, MyCharts).
vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

beforeEach(async () => {
  await resetDbForTests();
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false });
});

function mount(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

describe('Landing internal cross-links ("Also on ChartGenie")', () => {
  it('/pie-chart-maker links to the other two tool pages, not to itself', async () => {
    mount('/pie-chart-maker');
    const nav = await screen.findByRole('navigation', { name: /other chart tools/i }, { timeout: 3000 });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(within(nav).getByRole('link', { name: new RegExp(routeMetadata['/bar-graph-maker'].heading) })).toHaveAttribute('href', '/bar-graph-maker');
    expect(within(nav).getByRole('link', { name: new RegExp(routeMetadata['/convert-excel-to-chart'].heading) })).toHaveAttribute('href', '/convert-excel-to-chart');
    expect(within(nav).queryByRole('link', { name: new RegExp(routeMetadata['/pie-chart-maker'].heading) })).toBeNull();
  });

  it('/bar-graph-maker links to the other two tool pages, not to itself', async () => {
    mount('/bar-graph-maker');
    const nav = await screen.findByRole('navigation', { name: /other chart tools/i }, { timeout: 3000 });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(within(nav).queryByRole('link', { name: new RegExp(routeMetadata['/bar-graph-maker'].heading) })).toBeNull();
  });

  it('clicking a cross-link actually navigates to that tool page', async () => {
    mount('/pie-chart-maker');
    const nav = await screen.findByRole('navigation', { name: /other chart tools/i }, { timeout: 3000 });
    within(nav).getByRole('link', { name: new RegExp(routeMetadata['/bar-graph-maker'].heading) }).click();
    expect(await screen.findByRole('heading', { name: routeMetadata['/bar-graph-maker'].heading }, { timeout: 3000 })).toBeInTheDocument();
  });

  it('the page still has exactly one H1 matching its own heading (unchanged by the new nav)', async () => {
    mount('/convert-excel-to-chart');
    expect(await screen.findByRole('heading', { level: 1, name: routeMetadata['/convert-excel-to-chart'].heading }, { timeout: 3000 })).toBeInTheDocument();
  });
});
