import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MeasurementConsent } from '../components/MeasurementConsent';
import { CONSENT_KEY } from '../lib/gtag';
beforeEach(() => { localStorage.clear(); window.gtag = undefined; document.getElementById('ga4-gtag-script')?.remove(); vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'false'); vi.stubEnv('VITE_VERCEL_WEB_MEASUREMENT_READY', 'false'); });
it('states plainly that measurement is on by default and offers the opt-out', () => {
  render(<MeasurementConsent />);
  expect(screen.getByText(/Analytics is on by default so an ordinary visit is counted/)).toBeInTheDocument();
  expect(screen.queryByText(/consent starts denied/i)).toBeNull();
  expect(screen.queryByText(/cookieless visit counts only/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Turn measurement off' })).toBeInTheDocument();
});
it('offers reversible consent without remounting the workspace', () => {
  vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'true');
  render(<MeasurementConsent />);
  fireEvent.click(screen.getByRole('button', { name: 'Turn measurement off' }));
  expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
  fireEvent.click(screen.getByRole('button', { name: 'Turn measurement on' }));
  expect(localStorage.getItem(CONSENT_KEY)).toBe('granted');
});
it('initializes the page collector for saved consent even when GA is off', () => {
  vi.stubEnv('VITE_VERCEL_WEB_MEASUREMENT_READY', 'true');
  localStorage.setItem(CONSENT_KEY, 'granted');
  render(<MeasurementConsent />);
  expect(document.querySelector('script[src="/_vercel/insights/script.js"]')).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Turn measurement off' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Turn measurement off' }));
  expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
});