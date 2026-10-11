// @vitest-environment node
// The measurement module reads window.location.hostname at call time, so this
// node-environment suite installs a controllable fake window to prove the exact
// production-host gate turns every send into a no-op off the two live hosts.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, expect, it, vi } from 'vitest';
import { productionHost, pingAllowed, measurementAllowed, vercelWebAllowed, PRODUCTION_HOSTS, CONSENT_KEY } from '../lib/gtag';

function setHost(hostname: string, choice: string | null = 'granted') {
  (globalThis as unknown as Record<string, unknown>).window = { location: { hostname, pathname: '/charts', search: '', hash: '' } };
  (globalThis as unknown as Record<string, unknown>).localStorage = { getItem: () => choice, setItem: () => {} };
}

beforeEach(() => {
  vi.stubEnv('VITE_GA_MEASUREMENT_READY', 'true');
  vi.stubEnv('VITE_VERCEL_WEB_MEASUREMENT_READY', 'true');
  expect(CONSENT_KEY).toBe('chartgenie:measurement:v1');
});

it('exact production-host allowlist admits only the two live hosts', () => {
  expect([...PRODUCTION_HOSTS]).toEqual(['chartgenie.xyz', 'www.chartgenie.xyz']);
  for (const h of ['chartgenie.xyz', 'www.chartgenie.xyz']) expect(productionHost(h)).toBe(true);
  for (const h of ['localhost', '127.0.0.1', 'chartgenie-git-main.vercel.app', 'chartgenie-abc.vercel.app', 'chartgenie.local', '', null, undefined, 'chartgenie.xyz.evil.com', 'evil-chartgenie.xyz']) {
    expect(productionHost(h as string | null | undefined)).toBe(false);
  }
});

it('non-production hosts are no-ops across every send gate', () => {
  for (const h of ['chartgenie.xyz', 'www.chartgenie.xyz']) {
    setHost(h);
    expect(pingAllowed(), h).toBe(true);
    expect(measurementAllowed(), h).toBe(true);
    expect(vercelWebAllowed(), h).toBe(true);
  }
  for (const h of ['localhost', '127.0.0.1', 'chartgenie-git-main.vercel.app', 'preview.vercel.app', 'chartgenie.local']) {
    setHost(h);
    expect(pingAllowed(), h).toBe(false);
    expect(measurementAllowed(), h).toBe(false);
    expect(vercelWebAllowed(), h).toBe(false);
  }
});

it('host gate is wired into every send gate in source', () => {
  const src = readFileSync(resolve(process.cwd(), 'src/lib/gtag.ts'), 'utf8');
  expect(src).toMatch(/export const PRODUCTION_HOSTS = \['chartgenie\.xyz', 'www\.chartgenie\.xyz'\]/);
  expect((src.match(/productionHost\(\)/g) || []).length).toBeGreaterThanOrEqual(3);
});
