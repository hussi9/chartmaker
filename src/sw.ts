/// <reference lib="webworker" />
// Custom service worker (injectManifest mode — see vite.config.ts). The only
// hand-written logic here is the Web Share Target handler; everything else
// is Workbox's generated precache/route behavior, wired below exactly as
// vite-plugin-pwa's own injectManifest docs specify.
import { precacheAndRoute } from 'workbox-precaching';
import { db, openDb } from './db';

declare const self: ServiceWorkerGlobalScope;

// vite-plugin-pwa's build step rewrites this placeholder to a real array;
// the fallback only matters for importing this module outside that build
// (e.g. src/test/sw.test.ts, which exercises handleShareTarget directly).
precacheAndRoute(self.__WB_MANIFEST || []);

export async function handleShareTarget(request: Request): Promise<{ blob: Blob | null; redirectTo: string }> {
  const formData = await request.formData();
  const file = formData.get('image');
  // FormData.get() only ever returns a string or a File — checking "not a
  // string" (rather than `instanceof Blob`) is the robust discriminator:
  // different Request/FormData implementations (the browser's own vs.
  // Node's undici, used in tests) have their own Blob/File classes, and
  // `instanceof` fails across that boundary even for a genuine file.
  if (file !== null && typeof file !== 'string') {
    await openDb();
    await db.shareInbox.put({ id: 'pending', blob: file, at: Date.now() });
    return { blob: file, redirectTo: '/new?shared=1' };
  }
  return { blob: null, redirectTo: '/new?shared=1' };
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/new') {
    event.respondWith((async () => {
      const { redirectTo } = await handleShareTarget(event.request.clone());
      return Response.redirect(redirectTo, 303);
    })());
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
