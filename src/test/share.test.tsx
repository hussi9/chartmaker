import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { SharePage } from '@/components/share/SharePage';
import { encodeState } from '@/codec/state';
import { defaultSpec } from '@/chart/types';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { openDb } from '@/db';

vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

function mount(path: string) {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const share = createRoute({ getParentRoute: () => rootRoute, path: '/s/$state', component: () => <SharePage /> });
  const shareHash = createRoute({ getParentRoute: () => rootRoute, path: '/s', component: () => <SharePage /> });
  const edit = createRoute({ getParentRoute: () => rootRoute, path: '/edit/$id', component: () => <div>Editor page</div> });
  const idx = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <div>Templates page</div> });
  const router = createRouter({ routeTree: rootRoute.addChildren([idx, share, shareHash, edit]), history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

const spec = defaultSpec({ text: { title: 'Countries', subtitle: 'Stage-by-stage drop-off' }, options: { legend: false, grid: true, depth: false, showHandle: true, handle: 'ada' }, caption: { text: 'One market carries the funnel.', tone: 'punchy', edited: false } });

beforeEach(async () => {
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false });
  useDoc.getState().reset();
});

describe('SharePage', () => {
  it('renders the chart, handle, title, caption, table and actions from the path state', async () => {
    mount(`/s/${encodeState(spec)}`);
    expect(await screen.findByRole('heading', { name: 'Countries' })).toBeInTheDocument();
    expect(screen.getAllByText('@ada').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('One market carries the funnel.')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByText('87 · 65%')).toBeInTheDocument();
    expect(document.querySelector('svg.cg-frame')).not.toBeNull();
    expect(screen.getByRole('button', { name: /remix with your numbers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download png/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy data/i })).toBeInTheDocument();
    expect(screen.getByText('Made with ChartGenie, free, in the browser.')).toBeInTheDocument();
  });

  it('reads the state from the hash when the path has none', async () => {
    window.location.hash = `#${encodeState(spec)}`;
    mount('/s');
    expect(await screen.findByRole('heading', { name: 'Countries' })).toBeInTheDocument();
    window.location.hash = '';
  });

  it('Remix opens the editor with zeroed values and the credit', async () => {
    const user = userEvent.setup();
    mount(`/s/${encodeState(spec)}`);
    await user.click(await screen.findByRole('button', { name: /remix with your numbers/i }));
    expect(await screen.findByText('Editor page')).toBeInTheDocument();
    const d = useDoc.getState().spec;
    expect(d.data.every((r) => r.value === 0)).toBe(true);
    expect(d.data.map((r) => r.label)).toEqual(['USA', 'Italy', 'UK', 'Ireland']);
    expect(d.options.remixedFrom).toBe('ada');
    expect(d.options.handle).toBeUndefined();
    expect(d.caption).toBeUndefined();
  });

  it('shows a fallback for an invalid state', async () => {
    mount('/s/not-a-chart');
    expect(await screen.findByText(/doesn.t contain a chart/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /make one/i })).toBeInTheDocument();
  });
});

describe('honest share page (review item 10)', () => {
  it('never prints a fabricated time', async () => {
    mount(`/s/${encodeState(spec)}`);
    await screen.findByRole('button', { name: /remix with your numbers/i });
    expect(screen.queryByText(/just now|ago/)).toBeNull();
  });
});
