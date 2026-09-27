import { test, expect } from '@playwright/test';

test('home loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  // Vercel injects its preview toolbar (vercel.live) on preview deployments; its errors are not ours.
  const ours = (src: string) => !/vercel\.live|vercel-live/.test(src);
  page.on('console', (m) => { if (m.type() === 'error' && ours(m.location().url + m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => { if (ours(e.stack ?? e.message)) errors.push(e.message); });
  await page.goto('/');
  await expect(page).toHaveTitle(/ChartGenie/);
  expect(errors).toEqual([]);
});
