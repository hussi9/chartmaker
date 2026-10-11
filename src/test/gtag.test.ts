import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initGoogleAnalytics, track, trackPageView, CONSENT_KEY } from '../lib/gtag';

describe('analytics privacy', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'true');
    localStorage.setItem(CONSENT_KEY, 'granted');
    window.history.replaceState({}, '', '/');
    document.getElementById('ga4-gtag-script')?.remove();
    window.gtag = undefined;
    window.dataLayer = undefined;
  });

  it('initializes the same measurement ID once and configures on load', () => {
    initGoogleAnalytics('G-TEST');
    initGoogleAnalytics('G-TEST');
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1);
    expect(window.dataLayer?.filter((args) => (args as unknown[])[0] === 'consent')).toHaveLength(1);
    (document.getElementById('ga4-gtag-script') as HTMLScriptElement).dispatchEvent(new Event('load'));
    expect(window.dataLayer?.filter((args) => (args as unknown[])[0] === 'config')).toHaveLength(1);
  });

  it('sends only allow-listed events with enumerated or numeric parameters', () => {
    const send = vi.fn();
    window.gtag = send;
    track('export_set', { sizes: 3, formats: 'png+svg' });
    track('suggestion_use', { type: 'funnel', rank: 1 });
    expect(send).toHaveBeenCalledWith('event', 'export_set', expect.objectContaining({ sizes: 3, formats: 'png+svg' }));
    expect(send).toHaveBeenCalledWith('event', 'suggestion_use', expect.objectContaining({ type: 'funnel', rank: 1 }));
  });

  it('drops unknown events and free-text values', () => {
    const send = vi.fn();
    window.gtag = send;
    // @ts-expect-error unknown event names are rejected at the type level too
    track('chart_title_typed', { title: 'Confidential acquisition plan' });
    track('share_copy', { mode: 'Confidential acquisition plan' as 'path' });
    track('check_fail', { id: 'contrast', detail: 'USA (13)' } as never);
    expect(JSON.stringify(send.mock.calls)).not.toMatch(/Confidential|USA/);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('event', 'check_fail', expect.objectContaining({ id: 'contrast' }));
  });

  it('page views carry the route pattern, never the state in a share URL', () => {
    const send = vi.fn();
    window.gtag = send;
    trackPageView('/s/$state');
    trackPageView('/s/H4sIAAAAAAAAA-secret');
    expect(send).not.toHaveBeenCalled();
  });
});
