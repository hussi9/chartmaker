import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4319';
// Vercel previews sit behind SSO; VERCEL_BYPASS carries the project's automation bypass secret.
const bypass = process.env.VERCEL_BYPASS;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: { baseURL, trace: 'retain-on-failure', extraHTTPHeaders: bypass ? { 'x-vercel-protection-bypass': bypass } : {} },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run preview -- --port 4319 --strictPort', port: 4319, reuseExistingServer: false, timeout: 60_000 },
});
