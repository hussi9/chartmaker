import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { openDb } from '@/db';

vi.mock('@/chart/echarts', async (orig) => {
  const real = await orig<typeof import('@/chart/echarts')>();
  const init = (el: unknown, ...rest: unknown[]) =>
    el == null ? (real.echarts.init as (...a: unknown[]) => unknown)(el, ...rest) : { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(), getOption: vi.fn(), convertToPixel: vi.fn() };
  return { ...real, echarts: { ...real.echarts, init } };
});

function mount(path = '/edit/x') {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const mk = (p: string, text: string) => createRoute({ getParentRoute: () => rootRoute, path: p, component: () => <div>{text}</div> });
  const tree = rootRoute.addChildren([mk('/', 'Templates page'), mk('/new', 'New page'), mk('/charts', 'Charts page'), mk('/series', 'Series page'), mk('/brand', 'Brand page'), mk('/edit/$id', 'Editor page')]);
  const router = createRouter({ routeTree: tree, history: createMemoryHistory({ initialEntries: [path] }) });
  return render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  await openDb();
  useUi.setState({ storage: 'ok', narrow: false });
  useDoc.getState().reset();
  useDoc.getState().newDoc();
});

describe('CommandPalette', () => {
  it('opens with ⌘K, lists at least forty commands, and closes with Escape', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText('Editor page');
    expect(screen.queryByRole('dialog', { name: /command/i })).toBeNull();
    await user.keyboard('{Meta>}k{/Meta}');
    const dialog = await screen.findByRole('dialog', { name: /command/i });
    expect(within(dialog).getAllByRole('option').length).toBeGreaterThanOrEqual(40);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /command/i })).toBeNull());
  });

  it('"Change look → Dark" changes the open chart', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText('Editor page');
    await user.keyboard('{Meta>}k{/Meta}');
    await user.type(screen.getByRole('combobox', { name: /search or command/i }), 'dark');
    await user.click(await screen.findByRole('option', { name: /look.*dark/i }));
    expect(useDoc.getState().spec.look).toBe('dark');
  });

  it('navigation commands route', async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText('Editor page');
    await user.keyboard('{Meta>}k{/Meta}');
    await user.type(screen.getByRole('combobox', { name: /search or command/i }), 'my charts');
    await user.click(await screen.findByRole('option', { name: /go to my charts/i }));
    expect(await screen.findByText('Charts page')).toBeInTheDocument();
  });
});
