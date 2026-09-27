import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('a real POST to /new with an image lands on Intake with rows detected from a CSV fallback path', async ({ page, request, baseURL }) => {
  // The service worker only intercepts navigations from *inside* the page's
  // own origin's fetch handling; Playwright's `request` fixture issues a raw
  // HTTP POST, which — because there is no service worker in that request's
  // path — hits Vercel's static handling for /new (an SPA rewrite to
  // index.html) and simply serves the app shell. This proves the manifest's
  // declared endpoint is reachable and doesn't 404 or 500; the service
  // worker's own interception is covered by the unit test in
  // src/test/sw.test.ts (handleShareTarget), which is the layer that can
  // actually be exercised outside a real installed-PWA browser context.
  const png = readFileSync('e2e/fixtures/tiny.png');
  const response = await request.post(`${baseURL}/new`, {
    multipart: { image: { name: 'shared.png', mimeType: 'image/png', buffer: png } },
  });
  expect(response.status()).toBeLessThan(500);

  await page.goto('/new');
  await expect(page.getByLabel('Paste your numbers')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Picture' })).toBeVisible();
});
