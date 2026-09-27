import { test, expect } from '@playwright/test';
import { encodeState } from '../src/codec/state';
import { defaultSpec } from '../src/chart/types';

const spec = defaultSpec({ type: 'donut', text: { title: 'Countries by share', source: 'sample' }, options: { legend: false, grid: true, depth: false, showHandle: true, handle: 'ada' } });

test('a share link renders the chart and Remix opens the editor with zeroed values', async ({ page }) => {
  await page.goto(`/s/${encodeState(spec)}`);
  await expect(page.getByRole('heading', { name: 'Countries by share' })).toBeVisible();
  await expect(page.getByText('Made with ChartGenie, free, in the browser.')).toBeVisible();
  await page.getByRole('button', { name: 'Remix with your numbers' }).click();
  await expect(page).toHaveURL(/\/edit\//);
  await expect(page.getByRole('group', { name: 'Post size' })).toBeVisible();
  const firstValue = page.getByLabel('Value 1');
  await expect(firstValue).toHaveValue('0');
  await expect(page.getByLabel('Label 1')).toHaveValue('USA');
});

test('a legacy "#state=" link from the previous product still opens', async ({ page }) => {
  const legacy = { title: 'Legacy funnel', chartType: 'funnel', schemeId: 'spotify', data: [{ name: 'Visited', value: 100 }, { name: 'Paid', value: 12 }] };
  const b64 = Buffer.from(encodeURIComponent(JSON.stringify(legacy))).toString('base64');
  await page.goto(`/#state=${b64}`);
  await expect(page).toHaveURL(/\/s#state=/);
  await expect(page.getByRole('heading', { name: 'Legacy funnel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remix with your numbers' })).toBeVisible();
});
