import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initGoogleAnalytics, trackEvent, trackChartCreate, trackThemeSelection } from '../lib/gtag';

describe('analytics privacy', () => {
  beforeEach(() => {
    document.getElementById('ga4-gtag-script')?.remove();
    window.gtag = undefined;
    window.dataLayer = undefined;
  });

  it('initializes the same measurement ID once', () => {
    initGoogleAnalytics('G-TEST');
    initGoogleAnalytics('G-TEST');
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1);
    expect(window.dataLayer?.filter((args) => args[0] === 'config')).toHaveLength(1);
  });

  it('never sends free text from chart titles or additional parameters', () => {
    const send = vi.fn();
    window.gtag = send;
    trackEvent('export_png', 'Confidential category', 'Confidential acquisition plan', 4, { chart_title: 'Secret', export_format: 'png' });
    expect(JSON.stringify(send.mock.calls)).not.toMatch(/Confidential|Secret/);
    expect(send).toHaveBeenCalledWith('event', 'export_png', expect.objectContaining({ export_format: 'png' }));
  });

  it('keeps known chart dimensions while discarding arbitrary text', () => {
    const send = vi.fn();
    window.gtag = send;
    trackChartCreate('bar', 'apple', '16:9', 4);
    trackThemeSelection('Confidential chart title');
    expect(send.mock.calls[0][2]).toMatchObject({ chart_type: 'bar', theme_id: 'apple', aspect_ratio: '16:9', points_count: 4 });
    expect(JSON.stringify(send.mock.calls)).not.toContain('Confidential chart title');
  });
});
