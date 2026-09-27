import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import './design/fonts';
import './index.css';
import { routeTree } from './routeTree.gen';
import { initGoogleAnalytics } from './lib/gtag';
import { handleLaunchFile } from './lib/launchFiles';

const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

initGoogleAnalytics();

// PWA file handling: a .csv or a photo opened with ChartGenie lands on the
// intake screen — see src/lib/launchFiles.ts for why a photo doesn't just
// get read as text here.
const lq = (window as { launchQueue?: { setConsumer(cb: (p: { files: { getFile(): Promise<File> }[] }) => void): void } }).launchQueue;
lq?.setConsumer(async (params) => {
  const handle = params.files?.[0];
  if (!handle) return;
  const file = await handle.getFile();
  const { search } = await handleLaunchFile(file);
  void router.navigate({ to: '/new', search });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
