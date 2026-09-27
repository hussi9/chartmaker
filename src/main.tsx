import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import './design/fonts';
import './index.css';
import { routeTree } from './routeTree.gen';
import { initGoogleAnalytics } from './lib/gtag';

const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

initGoogleAnalytics();

// PWA file handling: a .csv opened with ChartGenie lands on the intake screen.
const lq = (window as { launchQueue?: { setConsumer(cb: (p: { files: { getFile(): Promise<File> }[] }) => void): void } }).launchQueue;
lq?.setConsumer(async (params) => {
  const handle = params.files?.[0];
  if (!handle) return;
  const file = await handle.getFile();
  const text = (await file.text()).slice(0, 20_000);
  void router.navigate({ to: '/new', search: { text } });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
