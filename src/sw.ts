/// <reference lib="webworker" />
// Custom service worker (injectManifest mode — see vite.config.ts). The only
// hand-written logic here is the Web Share Target handler; everything else
// is Workbox's generated precache/route behavior, wired below exactly as
// vite-plugin-pwa's own injectManifest docs specify.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { db, openDb } from './db';

declare const self: ServiceWorkerGlobalScope;

// vite-plugin-pwa's build step rewrites this placeholder to a real array;
// the fallback only matters for importing this module outside that build
// (e.g. src/test/sw.test.ts, which exercises handleShareTarget directly).
const manifest = self.__WB_MANIFEST || [];
cleanupOutdatedCaches();
precacheAndRoute(manifest);
// Replaces the previous auto-generated service worker's default
// navigateFallback: every in-scope navigation (/new, /charts, /edit/:id,
// /series, /brand, and the manifest's own shortcuts) is served the cached
// app shell offline, exactly as before this file existed by hand.
// createHandlerBoundToURL throws immediately if its URL isn't precached —
// true only outside a real build (see the fallback above), so this stays
// import-safe for src/test/sw.test.ts too.
if (manifest.length > 0) registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

export async function handleShareTarget(request: Request): Promise<{ blob: Blob | null; redirectTo: string }> {
  // A malformed body or a storage failure (private mode, quota) must never
  // turn a share into a browser error page — worst case, land on a bare
  // /new rather than leave the OS's share sheet stuck or failed.
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    // FormData.get() only ever returns a string or a File — checking "not a
    // string" (rather than `instanceof Blob`) is the robust discriminator:
    // different Request/FormData implementations (the browser's own vs.
    // Node's undici, used in tests) have their own Blob/File classes, and
    // `instanceof` fails across that boundary even for a genuine file.
    const hasFile = file !== null && typeof file !== 'string';
    if (hasFile) {
      await openDb();
      await db.shareInbox.put({ id: 'pending', blob: file, at: Date.now() });
    }
    // The old GET share_target passed text/url straight through as query
    // params; switching to POST for the image case must not drop that — a
    // share carries all three fields, any combination, in one POST.
    const q = new URLSearchParams();
    for (const key of ['text', 'url', 'title']) {
      const value = formData.get(key);
      if (typeof value === 'string' && value.trim()) q.set(key, value);
    }
    if (hasFile) q.set('shared', '1');
    const query = q.toString();
    return { blob: hasFile ? file : null, redirectTo: query ? `/new?${query}` : '/new' };
  } catch {
    return { blob: null, redirectTo: '/new' };
  }
}

// A same-origin POST to /new only — never hijack a page's own POST to some
// other host that happens to share this path, and Workbox's NavigationRoute
// above only ever matches GET, so the two never compete for the same request.
export function isShareTargetRequest(request: Request, origin: string): boolean {
  if (request.method !== 'POST') return false;
  const url = new URL(request.url);
  return url.origin === origin && url.pathname === '/new';
}

self.addEventListener('fetch', (event) => {
  if (isShareTargetRequest(event.request, self.location.origin)) {
    event.respondWith((async () => {
      const { redirectTo } = await handleShareTarget(event.request.clone());
      return Response.redirect(redirectTo, 303);
    })());
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
