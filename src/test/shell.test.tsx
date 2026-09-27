import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRouter, createMemoryHistory, RouterProvider, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Shell } from '@/components/shell/Shell';
import { useUi } from '@/store/ui';
import { db, openDb } from '@/db';

function makeRouter(path: string) {
  const rootRoute = createRootRoute({ component: () => <Shell><Outlet /></Shell> });
  const mk = (p: string, text: string) => createRoute({ getParentRoute: () => rootRoute, path: p, component: () => <div>{text}</div> });
  const tree = rootRoute.addChildren([mk('/', 'Templates page'), mk('/new', 'New page'), mk('/charts', 'Charts page'), mk('/series', 'Series page'), mk('/brand', 'Brand page')]);
  return createRouter({ routeTree: tree, history: createMemoryHistory({ initialEntries: [path] }) });
}

function setWidth(px: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({ matches: q.includes('max-width') ? px < 900 : px >= 900, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }),
  });
}

beforeEach(async () => {
  await openDb();
  await db.settings.clear();
  useUi.setState({ handle: undefined, narrow: false });
});

describe('Shell', () => {
  it('renders the five rail links with the active one marked', async () => {
    setWidth(1440);
    render(<RouterProvider router={makeRouter('/charts')} />);
    await screen.findByText('Charts page');
    const nav = screen.getByRole('navigation', { name: /primary/i });
    const links = nav.querySelectorAll('a.cg-rb, a.cg-tab');
    expect([...links].map((a) => a.textContent?.trim())).toEqual(['New', 'Templates', 'My charts', 'Series', 'Brand']);
    expect(nav.querySelector('a.cg-rb[aria-current="page"]')?.textContent).toContain('My charts');
  });

  it('shows "Set handle" when no handle is stored and the handle when it is', async () => {
    setWidth(1440);
    render(<RouterProvider router={makeRouter('/')} />);
    expect(await screen.findByText('Set handle')).toBeInTheDocument();
    useUi.setState({ handle: 'ada' });
    expect(await screen.findByText('@ada')).toBeInTheDocument();
  });

  it('uses a bottom tab bar instead of the rail under 900px', async () => {
    setWidth(390);
    useUi.setState({ narrow: true });
    render(<RouterProvider router={makeRouter('/')} />);
    await screen.findByText('Templates page');
    expect(screen.getByRole('navigation', { name: /primary/i })).toHaveClass('cg-tabbar');
    expect(document.querySelector('.cg-rail')).toBeNull();
  });

  it('has a top bar with the brand and a slot for actions', async () => {
    setWidth(1440);
    render(<RouterProvider router={makeRouter('/')} />);
    await screen.findByText('Templates page');
    expect(screen.getByRole('banner')).toHaveTextContent('ChartGenie');
    expect(document.querySelector('.cg-topbar-actions')).not.toBeNull();
  });

  it('renders toasts from the ui store', async () => {
    setWidth(1440);
    render(<RouterProvider router={makeRouter('/')} />);
    await screen.findByText('Templates page');
    useUi.getState().toast('Link copied');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Link copied'));
  });
});
