// Google Analytics 4 with a hard allow-list (Consent Mode v2). Chart titles,
// labels, values, captions and share states never reach this module's output.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const DEFAULT_GA_ID = 'G-96D837GEH9';
export const CONSENT_KEY = 'chartgenie:measurement:v1';
// Vercel Web Analytics is enabled for this production project. Explicit false
// keeps a future rollout off; consent remains mandatory in every environment.
export const VERCEL_WEB_READY = import.meta.env.VITE_VERCEL_WEB_MEASUREMENT_READY !== 'false';
let preferenceWriteFailed = false;
let lastPageViewRoute: string | null = null;
export const PUBLIC_ROUTES = ['/', '/new', '/charts', '/brand', '/series', '/pie-chart-maker', '/bar-graph-maker', '/line-graph-maker', '/convert-excel-to-chart', '/chart-for-linkedin-post', '/export-chart-as-svg', '/chart-maker-no-signup', '/edit/$id'] as const;

// Exact production-host gate: only the two live hosts may report to GA4. Every
// other origin (localhost, 127.0.0.1, *.vercel.app previews, *.local) is a no-op
// so developer and preview sessions never pollute production analytics.
export const PRODUCTION_HOSTS = ['chartgenie.xyz', 'www.chartgenie.xyz'] as const;
export function productionHost(host?: string | null): boolean {
  const h = host ?? (typeof window === 'undefined' ? '' : window.location.hostname);
  return (PRODUCTION_HOSTS as readonly string[]).includes(h);
}

// Consent Mode v2 defaults: analytics_storage granted in every region so visits
// are counted in reports; ad signals stay denied and never upgrade. A visitor's
// explicit "off" (or a browser privacy signal) still stops every send.
// Trade-off (owner decision, 2026-10-16): granting analytics by default in the
// EEA/UK/CH is stricter-consent territory under GDPR/ePrivacy; region-scoped
// denial can be reintroduced by adding a `region` list to this default.
export const CONSENT_DEFAULTS = { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' } as const;

export function currentMeasurementRoute(): string | null {
  if (window.location.search || window.location.hash) return null;
  const path = window.location.pathname;
  if (/^\/edit\/[^/]+$/.test(path)) return '/edit/$id';
  return (PUBLIC_ROUTES as readonly string[]).includes(path) ? path : null;
}
// Route reported to Vercel monitoring (G-08): the same allowlisted pattern GA4 gets, so a
// concrete local chart id in /edit/<id> is never sent. Null skips the send.
export function vercelRoute(path: string): string | null {
  return path === window.location.pathname ? currentMeasurementRoute() : null;
}
export function measurementReady(): boolean { return import.meta.env.VITE_GA_MEASUREMENT_READY === 'true'; }
export function privacySignal(): boolean {
  return navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}
function savedChoice(): string | null {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}
// Full measurement (product events, Vercel monitoring): allowed unless the
// visitor explicitly opted out or a browser privacy signal is present.
export function measurementAllowed(): boolean {
  try { return !!currentMeasurementRoute() && productionHost() && !preferenceWriteFailed && measurementReady() && !privacySignal() && savedChoice() !== 'denied'; } catch { return false; }
}
// Cookieless-ping gate (Consent Mode v2): the tag loads with consent defaults
// denied unless the visitor explicitly opted out, a privacy signal is on, the
// release gate is closed, or the URL is not a clean allowlisted public route.
export function pingAllowed(): boolean {
  try { return !!currentMeasurementRoute() && productionHost() && !preferenceWriteFailed && measurementReady() && !privacySignal() && savedChoice() !== 'denied'; } catch { return false; }
}
export function vercelWebAllowed(): boolean {
  try { return !!currentMeasurementRoute() && productionHost() && !preferenceWriteFailed && VERCEL_WEB_READY && !privacySignal() && savedChoice() !== 'denied'; } catch { return false; }
}
function disableMeasurement(): void {
  (window as unknown as Record<string, unknown>)[`ga-disable-${getActiveGaMeasurementId()}`] = true;
  const script = document.getElementById('ga4-gtag-script');
  if (script && script.dataset.loaded !== 'true') {
    window.dataLayer?.splice(0);
    delete script.dataset.configuredId;
  }
}
// Install before router and provider initialization. This changes no pageview ownership.
export function observeMeasurementRoutes(): () => void {
  const history = window.history;
  const push = history.pushState;
  const replace = history.replaceState;
  const sync = () => {
    if (!pingAllowed()) disableMeasurement();
    else (window as unknown as Record<string, unknown>)[`ga-disable-${getActiveGaMeasurementId()}`] = false;
    window.dispatchEvent(new Event('measurement-consent-change'));
  };
  const wrap = (original: History['pushState']): History['pushState'] => function (...args) {
    disableMeasurement();
    try { return original.apply(history, args); } finally { sync(); }
  };
  const wrappedPush = wrap(push);
  const wrappedReplace = wrap(replace);
  history.pushState = wrappedPush;
  history.replaceState = wrappedReplace;
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
  window.addEventListener('storage', sync);
  sync();
  return () => {
    if (history.pushState === wrappedPush) history.pushState = push;
    if (history.replaceState === wrappedReplace) history.replaceState = replace;
    window.removeEventListener('popstate', sync);
    window.removeEventListener('hashchange', sync);
    window.removeEventListener('storage', sync);
  };
}
// Upgrade or downgrade consent once the provider is loaded. Only analytics_storage is
// ever granted; ad signals never upgrade.
function applyConsent(): void {
  const script = document.getElementById('ga4-gtag-script');
  if (!script || script.dataset.loaded !== 'true' || !window.gtag) return;
  if (measurementAllowed()) {
    (window as unknown as Record<string, unknown>)[`ga-disable-${getActiveGaMeasurementId()}`] = false;
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
  } else {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
}
export function setMeasurementConsent(granted: boolean): void {
  const allow = granted && !privacySignal();
  // Disable first so failures during preference storage or provider calls cannot defeat withdrawal.
  disableMeasurement();
  // Consent changes never replay an earlier navigation; a pageview is owned by
  // the route hook that observed it.
  if (!granted) lastPageViewRoute = null;
  try { localStorage.setItem(CONSENT_KEY, allow ? 'granted' : 'denied'); preferenceWriteFailed = false; } catch { preferenceWriteFailed = true; }
  const effectivePing = pingAllowed();
  (window as unknown as Record<string, unknown>)[`ga-disable-${getActiveGaMeasurementId()}`] = !effectivePing;
  if (effectivePing) initGoogleAnalytics();
  applyConsent();
  window.dispatchEvent(new Event('measurement-consent-change'));
}
// Sanitize provider-automatic events to the allowlisted route pattern + origin,
// never a concrete id, query or fragment.
function sanitizedLocation(): { page_location: string; page_path: string } | null {
  const route = currentMeasurementRoute();
  if (!route) return null;
  return { page_location: window.location.origin + route, page_path: route };
}
function context(route: string) {
  return { page_path: route, page_location: window.location.origin + route, page_title: 'ChartGenie', page_referrer: '', measurement_schema: 'cohort01_v1' };
}
function sendPageView(route: string): void {
  if (!pingAllowed() || !window.gtag || document.getElementById('ga4-gtag-script')?.dataset.loaded !== 'true') return;
  if (lastPageViewRoute === route) return;
  // Consent state must be queued BEFORE the hit: gtag.js processes the
  // dataLayer in order, so a page_view sent while the queued state is still
  // denied goes out as a cookieless ping and never reaches reports.
  applyConsent();
  window.gtag?.('event', 'page_view', context(route));
  lastPageViewRoute = route;
}

export function getActiveGaMeasurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_GA_ID;
}

export function initGoogleAnalytics(measurementId?: string): void {
  if (typeof window === 'undefined' || !pingAllowed()) return;
  const id = measurementId || getActiveGaMeasurementId();
  if (!/^G-[A-Z0-9]+$/.test(id)) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = false;
  const scriptId = 'ga4-gtag-script';
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (existing) return;
  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.addEventListener('load', () => {
    script.dataset.loaded = 'true';
    if (!pingAllowed()) { disableMeasurement(); return; }
    const loadedRoute = currentMeasurementRoute();
    window.gtag?.('js', new Date());
    window.gtag?.('config', id, { send_page_view: false, anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false, ...context(loadedRoute!) });
    const sl = sanitizedLocation();
    if (sl) window.gtag?.('set', sl);
    applyConsent();
    if (loadedRoute) sendPageView(loadedRoute);
  });
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // Never queue event commands before the provider has loaded: gtag.js would
    // replay them, and pre-render product events and pageviews must never reach Google.
    if (arguments[0] === 'event' && script.dataset.loaded !== 'true') return;
    // gtag commands must be pushed as Arguments objects, never arrays.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  // Consent Mode v2 requires the defaults BEFORE gtag.js downloads: until an
  // explicit allow arrives, Google may only send cookieless pings.
  window.gtag('consent', 'default', { ...CONSENT_DEFAULTS });
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
}

// Every event and every parameter it may carry. Strings must match the listed values.
const EVENTS = {
  export_failed: { operation: ['set', 'png', 'svg', 'csv', 'copy'] },
  intake_detect: { kind: ['cells', 'sentence', 'csv', 'image', 'empty'], rows: 'number' },
  suggestion_use: { type: 'chartType', rank: 'number' },
  export_set: { sizes: 'number', formats: ['png', 'svg', 'png+svg'] },
  export_one: { format: ['png', 'svg', 'csv', 'copy'] },
  share_copy: { mode: ['path', 'hash'] },
  remix_open: {},
  series_update: { cadence: ['weekly', 'monthly', 'quarterly'] },
  brand_apply: {},
  check_fail: { id: ['contrast', 'textSize', 'cropZone', 'altText'] },
  share_target_miss: {},
  template_use: { type: 'chartType' },
  look_change: { look: ['clean', 'bold', 'dark', 'newsletter'] },
  size_change: { size: ['16:9', '1:1', '9:16', '4:3'] },
} as const;

const CHART_TYPES = new Set(['pie', 'donut', 'bar', 'horizontalBar', 'stackedBar', 'stackedColumn', 'stackedHorizontal', 'line', 'stackedLine', 'area', 'stackedArea', 'radar', 'scatter', 'heatmap', 'threshold', 'gauge', 'funnel', 'kpi', 'matrix']);

type Events = typeof EVENTS;
type ParamValue<S> = S extends readonly string[] ? S[number] : S extends 'number' ? number : S extends 'chartType' ? string : never;
export type EventParams<E extends keyof Events> = { [K in keyof Events[E]]: ParamValue<Events[E][K]> };

export function track<E extends keyof Events>(event: E, params: EventParams<E>): void {
  if (!Object.prototype.hasOwnProperty.call(EVENTS, event)) return;
  const schema = EVENTS[event] as Record<string, readonly string[] | 'number' | 'chartType'> | undefined;
  if (!schema || typeof window === 'undefined' || !measurementAllowed() || !window.gtag) return;
  const route = currentMeasurementRoute();
  if (!route || !params || typeof params !== 'object') return;
  const clean: Record<string, string | number> = {};
  for (const [key, rule] of Object.entries(schema)) {
    const v = (params as Record<string, unknown>)[key];
    if (rule === 'number') {
      const maximum = key === 'rows' ? 100000 : key === 'sizes' ? 20 : 100;
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0 || v > maximum) return;
      clean[key] = v; continue;
    }
    if (rule === 'chartType') {
      if (typeof v !== 'string' || !CHART_TYPES.has(v)) return;
      clean[key] = v; continue;
    }
    if (typeof v !== 'string' || !rule.includes(v)) return;
    clean[key] = v;
  }
  try { window.gtag('event', event, { ...clean, ...context(route) }); } catch { /* Measurement must not interrupt tools. */ }
}

// Route hooks own pageviews. Consent changes never replay earlier navigation.
export function trackPageView(routePattern: string): void {
  if (typeof window === 'undefined' || !pingAllowed()) return;
  const route = currentMeasurementRoute();
  if (!route || route !== routePattern) return;
  initGoogleAnalytics();
  try { sendPageView(route); } catch { /* Best effort. */ }
}