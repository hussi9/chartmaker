import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MeasurementConsent } from '../components/MeasurementConsent';
import { CONSENT_KEY } from '../lib/gtag';
beforeEach(() => { localStorage.clear(); window.gtag = undefined; document.getElementById('ga4-gtag-script')?.remove(); vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'false'); vi.stubEnv('VITE_VERCEL_WEB_MEASUREMENT_READY', 'false'); });
it('offers opt-in with cookieless visit counts by default', () => {
  render(<MeasurementConsent />);
  expect(screen.getByText(/cookieless visit counts only/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Allow optional measurement' })).toBeInTheDocument();
});
it('offers reversible consent without remounting the workspace', () => {
  vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'true');
  render(<MeasurementConsent />);
  fireEvent.click(screen.getByRole('button', { name: 'Allow optional measurement' }));
  expect(localStorage.getItem(CONSENT_KEY)).toBe('granted');
  fireEvent.click(screen.getByRole('button', { name: 'Turn off measurement' }));
  expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
});
it('initializes the page collector for saved consent even when GA is off', () => {
  vi.stubEnv('VITE_VERCEL_WEB_MEASUREMENT_READY', 'true');
  localStorage.setItem(CONSENT_KEY, 'granted');
  render(<MeasurementConsent />);
  expect(document.querySelector('script[src="/_vercel/insights/script.js"]')).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Turn off measurement' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Turn off measurement' }));
  expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
});