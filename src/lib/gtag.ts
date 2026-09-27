// Google Analytics 4 with a hard allow-list. Chart titles, labels, values,
// captions and share states never reach this module's output.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const DEFAULT_GA_ID = 'G-96D837GEH9';

export function getActiveGaMeasurementId(): string {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_GA_ID;
}

export function initGoogleAnalytics(measurementId?: string): void {
  if (typeof window === 'undefined') return;
  const id = measurementId || getActiveGaMeasurementId();
  if (!id) return;
  const scriptId = 'ga4-gtag-script';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) { window.dataLayer?.push(args); };
    window.gtag('js', new Date());
  }
  if (script.dataset.configuredId === id) return;
  script.dataset.configuredId = id;
  window.gtag?.('config', id, { send_page_view: false, anonymize_ip: true });
}

// Every event and every parameter it may carry. Strings must match the listed values.
const EVENTS = {
  intake_detect: { kind: ['cells', 'sentence', 'csv', 'empty'], rows: 'number' },
  suggestion_use: { type: 'chartType', rank: 'number' },
  export_set: { sizes: 'number', formats: ['png', 'svg', 'png+svg'] },
  export_one: { format: ['png', 'svg', 'csv', 'copy'] },
  share_copy: { mode: ['path', 'hash'] },
  remix_open: {},
  series_update: { cadence: ['weekly', 'monthly', 'quarterly'] },
  brand_apply: {},
  check_fail: { id: ['contrast', 'textSize', 'cropZone', 'altText'] },
  template_use: { type: 'chartType' },
  look_change: { look: ['clean', 'bold', 'dark', 'newsletter'] },
  size_change: { size: ['16:9', '1:1', '9:16', '4:3'] },
} as const;

const CHART_TYPES = new Set(['pie', 'donut', 'bar', 'horizontalBar', 'stackedBar', 'stackedColumn', 'stackedHorizontal', 'line', 'stackedLine', 'area', 'stackedArea', 'radar', 'scatter', 'heatmap', 'threshold', 'gauge', 'funnel', 'kpi', 'matrix']);

type Events = typeof EVENTS;
type ParamValue<S> = S extends readonly string[] ? S[number] : S extends 'number' ? number : S extends 'chartType' ? string : never;
export type EventParams<E extends keyof Events> = { [K in keyof Events[E]]: ParamValue<Events[E][K]> };

export function track<E extends keyof Events>(event: E, params: EventParams<E>): void {
  const schema = EVENTS[event] as Record<string, readonly string[] | 'number' | 'chartType'> | undefined;
  if (!schema || typeof window === 'undefined' || !window.gtag) return;
  const clean: Record<string, string | number> = {};
  for (const [key, rule] of Object.entries(schema)) {
    const v = (params as Record<string, unknown>)[key];
    if (rule === 'number') { if (typeof v === 'number' && Number.isFinite(v)) clean[key] = v; continue; }
    if (rule === 'chartType') { if (typeof v === 'string' && CHART_TYPES.has(v)) clean[key] = v; continue; }
    if (typeof v === 'string' && rule.includes(v)) clean[key] = v;
  }
  window.gtag('event', event, clean);
}

const ROUTE_PATTERN = /^\/([a-z-]+(\/\$[a-z]+)?)?$/;

// Only route patterns ("/edit/$id", "/s/$state"), never concrete ids or share states.
export function trackPageView(routePattern: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (!ROUTE_PATTERN.test(routePattern)) return;
  window.gtag('event', 'page_view', { page_path: routePattern });
}
