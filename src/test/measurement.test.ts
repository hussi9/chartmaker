import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, expect, it, vi } from 'vitest';
import { initGoogleAnalytics, track, trackPageView, setMeasurementConsent, measurementAllowed, pingAllowed, observeMeasurementRoutes, CONSENT_DEFAULTS, CONSENT_KEY } from '../lib/gtag';

function script() { return document.getElementById('ga4-gtag-script') as HTMLScriptElement | null; }
function commands() { return (window.dataLayer ?? []) as IArguments[]; }
function consentDefaults() { return commands().find((c) => c[0] === 'consent' && c[1] === 'default'); }

beforeEach(() => {
  vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'true');
  localStorage.clear();
  script()?.remove();
  window.gtag = undefined;
  window.dataLayer = undefined;
  window.history.replaceState({}, '', '/');
  (navigator as unknown as Record<string, unknown>).doNotTrack = null;
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: undefined });
});

it('Consent Mode v2 defaults deny analytics storage and every ad signal', () => {
  expect({ ...CONSENT_DEFAULTS }).toEqual({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
});

it('issues consent defaults before the tag script and pushes Arguments objects, never arrays', () => {
  const src = readFileSync(resolve(process.cwd(), 'src/lib/gtag.ts'), 'utf8');
  const defaults = src.indexOf('\'consent\', \'default\'');
  expect(defaults).toBeGreaterThan(-1);
  expect(defaults).toBeLessThan(src.indexOf('script.src ='));
  expect(src).toMatch(/window\.dataLayer\?\.push\(arguments\)/);
  expect(src).not.toMatch(/dataLayer\?\.push\(args\)/);
  expect(src).toMatch(/send_page_view: false/);
  expect(src).toMatch(/allow_google_signals: false/);
  expect(src).toMatch(/allow_ad_personalization_signals: false/);
  expect(src).toMatch(/anonymize_ip: true/);
  // Opt-in upgrades analytics_storage only; ad signals never upgrade.
  expect(src).not.toMatch(/'consent','update',\{[^}]*ad_/);
});

it('cookieless pings load the tag with no prior choice and consent denied first', () => {
  initGoogleAnalytics();
  expect(script()).not.toBeNull();
  expect(consentDefaults()).toBeDefined();
  expect(commands()[0][0]).toBe('consent');
  expect(commands()[0][1]).toBe('default');
  for (const c of commands()) expect(Object.prototype.toString.call(c)).toBe('[object Arguments]');
  script()!.dispatchEvent(new Event('load'));
  const views = commands().filter((c) => c[0] === 'event' && c[1] === 'page_view');
  expect(views).toHaveLength(1);
  expect(commands().filter((c) => c[0] === 'config')).toHaveLength(1);
});

it('opt-in upgrades analytics_storage only and stores the shared preference', () => {
  initGoogleAnalytics();
  script()!.dispatchEvent(new Event('load'));
  setMeasurementConsent(true);
  expect(localStorage.getItem(CONSENT_KEY)).toBe('granted');
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-96D837GEH9']).toBe(false);
  const updates = commands().filter((c) => c[0] === 'consent' && c[1] === 'update');
  expect(updates.some((c) => (c[2] as Record<string, string>).analytics_storage === 'granted')).toBe(true);
  for (const c of updates) {
    const p = c[2] as Record<string, string>;
    expect(p.ad_storage).toBeUndefined();
    expect(p.ad_user_data).toBeUndefined();
    expect(p.ad_personalization).toBeUndefined();
  }
});

it('explicit opt-out or a failed preference write kills every send', () => {
  initGoogleAnalytics();
  script()!.dispatchEvent(new Event('load'));
  setMeasurementConsent(true);
  const send = vi.fn();
  window.gtag = send;
  setMeasurementConsent(false);
  expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-96D837GEH9']).toBe(true);
  const afterOptOut = send.mock.calls.length;
  track('brand_apply', {});
  trackPageView('/');
  expect(send).toHaveBeenCalledTimes(afterOptOut); // no product event or pageview after opt-out
  // Failed write: an old grant must not survive a refused persistence.
  setMeasurementConsent(true);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('quota'); });
  setMeasurementConsent(true);
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-96D837GEH9']).toBe(true);
  expect(measurementAllowed()).toBe(false);
  // Clear the module-level write-failure latch so later tests start clean.
  setMeasurementConsent(true);
});

it('Do Not Track and Global Privacy Control skip the tag entirely', () => {
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' });
  initGoogleAnalytics();
  expect(script()).toBeNull();
  expect(window.dataLayer).toBeUndefined();
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '0' });
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
  initGoogleAnalytics();
  expect(script()).toBeNull();
  expect(window.dataLayer).toBeUndefined();
  expect(pingAllowed()).toBe(false);
});

it('sanitizes automatic context and events to the route pattern, never a concrete id, query or hash', () => {
  window.history.replaceState({}, '', '/edit/private-id');
  document.title = 'CANARY';
  initGoogleAnalytics();
  script()!.dispatchEvent(new Event('load'));
  trackPageView('/edit/$id');
  track('brand_apply', {});
  track('export_failed', { operation: 'png', message: 'PRIVATE_CANARY' } as never);
  const json = JSON.stringify(commands());
  expect(json).not.toMatch(/CANARY|private-id/);
  for (const c of commands().filter((x) => x[0] === 'config' || x[0] === 'event')) {
    expect(c[2]).toMatchObject({ page_location: window.location.origin + '/edit/$id', page_title: 'ChartGenie', page_referrer: '' });
  }
});

it('denies query/hash and private transitions without emitting views', () => {
  const stop = observeMeasurementRoutes();
  initGoogleAnalytics();
  script()!.dispatchEvent(new Event('load'));
  const send = vi.fn();
  window.gtag = send;
  setMeasurementConsent(true);
  window.history.pushState({}, '', '/?secret=CANARY');
  expect(measurementAllowed()).toBe(false);
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-96D837GEH9']).toBe(true);
  window.history.replaceState({}, '', '/#CANARY');
  expect(measurementAllowed()).toBe(false);
  window.history.replaceState({}, '', '/s/secret');
  setMeasurementConsent(true);
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-96D837GEH9']).toBe(true);
  window.history.replaceState({}, '', '/charts');
  expect(measurementAllowed()).toBe(true);
  expect(send.mock.calls.filter((c) => c[0] === 'event')).toHaveLength(0);
  stop();
});

it('withdrawal stops future sends and reacceptance does not replay earlier views', () => {
  const send = vi.fn();
  initGoogleAnalytics();
  script()!.dispatchEvent(new Event('load'));
  setMeasurementConsent(true);
  window.gtag = send;
  setMeasurementConsent(false);
  const count = send.mock.calls.length;
  track('brand_apply', {});
  trackPageView('/');
  expect(send).toHaveBeenCalledTimes(count);
  setMeasurementConsent(true);
  expect(send.mock.calls.filter((c) => c[0] === 'event')).toHaveLength(0);
});

it('excludes unsafe routes regardless of caller pattern', () => {
  setMeasurementConsent(true);
  const send = vi.fn();
  window.gtag = send;
  for (const path of ['/s/CANARY', '/s#CANARY', '/account', '/admin', '/unknown']) {
    window.history.replaceState({}, '', path);
    track('brand_apply', {});
    trackPageView('/');
  }
  expect(send).not.toHaveBeenCalled();
});

it('privacy signals override consent and numeric fields are bounded integers', () => {
  setMeasurementConsent(true);
  const send = vi.fn();
  window.gtag = send;
  track('export_set', { sizes: -1, formats: 'png' });
  track('intake_detect', { kind: 'csv', rows: Infinity });
  track('suggestion_use', { type: 'bar', rank: 1.5 });
  expect(send).not.toHaveBeenCalled();
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true });
  track('brand_apply', {});
  expect(send).not.toHaveBeenCalled();
  Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: undefined });
});

it('a throwing collector cannot interrupt user actions or consent changes', () => {
  setMeasurementConsent(true);
  window.gtag = () => { throw new Error('collector failed'); };
  expect(() => track('brand_apply', {})).not.toThrow();
  expect(() => trackPageView('/')).not.toThrow();
  expect(() => setMeasurementConsent(false)).not.toThrow();
});

it('rejects prototype event names and strips unknown fields from valid events', () => {
  setMeasurementConsent(true);
  const send = vi.fn();
  window.gtag = send;
  track('toString' as never, {});
  expect(send).not.toHaveBeenCalled();
  track('export_one', { format: 'CANARY' } as never);
  track('export_one', {} as never);
  track('suggestion_use', { type: 'CANARY', rank: 1 });
  track('template_use', {} as never);
  expect(send).not.toHaveBeenCalled();
  track('export_one', { format: 'png', title: 'CANARY' } as never);
  expect(send).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(send.mock.calls)).not.toContain('CANARY');
});