// G-08: Vercel page measurement must never receive a concrete chart id.
// The privacy page promises chart ids are mapped to their route pattern.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

const captured: { route?: (path: string) => string | null } = {};
vi.mock('../lib/browser-monitoring', () => ({
  installMonitoring: (input: { route: (path: string) => string | null }) => {
    captured.route = input.route;
    return { refresh: () => {}, destroy: () => {} };
  },
}));

import { MeasurementConsent } from '../components/MeasurementConsent';
import { CONSENT_KEY } from '../lib/gtag';

beforeEach(() => {
  captured.route = undefined;
  localStorage.clear();
  localStorage.setItem(CONSENT_KEY, 'granted');
});
afterEach(() => window.history.pushState({}, '', '/'));

it('reports an editor visit as /edit/$id, never the concrete chart id', () => {
  window.history.pushState({}, '', '/edit/chart-8f3a2c');
  render(<MeasurementConsent />);
  expect(captured.route).toBeTypeOf('function');
  expect(captured.route!('/edit/chart-8f3a2c')).toBe('/edit/$id');
});

it('still reports a clean public route as itself', () => {
  window.history.pushState({}, '', '/edit/chart-8f3a2c');
  render(<MeasurementConsent />);
  window.history.pushState({}, '', '/');
  expect(captured.route!('/')).toBe('/');
});

it('drops a path that is not the current clean location', () => {
  window.history.pushState({}, '', '/edit/chart-8f3a2c');
  render(<MeasurementConsent />);
  expect(captured.route!('/edit/other-id')).toBeNull();
  window.history.pushState({}, '', '/edit/chart-8f3a2c?x=1');
  expect(captured.route!('/edit/chart-8f3a2c')).toBeNull();
});
