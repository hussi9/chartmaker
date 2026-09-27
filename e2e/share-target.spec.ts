import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// A real OS share only reaches the app through the installed service
// worker's fetch handler (see src/sw.ts's handleShareTarget) — Playwright's
// `request` fixture bypasses it entirely (review item I3), so this drives
// an actual browser-level multipart form submission against a page the
// service worker controls, the same way Chrome's share sheet does.
async function waitForServiceWorkerControl(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 15_000 });
}

test('sharing a photo lands on Intake with the picture already read, via the real service worker', async ({ page }) => {
  await waitForServiceWorkerControl(page);
  const png = readFileSync('e2e/fixtures/tiny.png');
  const base64 = png.toString('base64');

  await page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const file = new File([bytes], 'shared.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const form = document.createElement('form');
    form.method = 'post';
    form.enctype = 'multipart/form-data';
    form.action = '/new';
    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'image';
    input.files = dt.files;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }, base64);

  await page.waitForURL(/\/new\?shared=1$/, { timeout: 15_000 });
  // Proves the blob actually crossed the SW -> IndexedDB -> page boundary,
  // not just that the redirect happened: either callout appears depending
  // on how fast the (real, on-device) OCR engine responds in CI.
  await expect(page.getByText(/setting up picture reading|reading your picture/i)).toBeVisible({ timeout: 15_000 });
});

test('sharing text lands on Intake with the text pre-filled, via the real service worker (review item C2)', async ({ page }) => {
  await waitForServiceWorkerControl(page);

  await page.evaluate(() => {
    const form = document.createElement('form');
    form.method = 'post';
    form.enctype = 'multipart/form-data';
    form.action = '/new';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'text';
    input.value = 'hello';
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  });

  await page.waitForURL(/\/new\?text=hello$/, { timeout: 15_000 });
  await expect(page.getByLabel('Paste your numbers')).toHaveValue('hello');
});
