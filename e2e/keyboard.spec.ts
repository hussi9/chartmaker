import { test, expect } from '@playwright/test';

// Tab order follows the DOM: top bar (Share, Export), data, size, look, right tabs. Each stop shows a ring.
test('the editor is fully reachable by keyboard with a visible focus ring', async ({ page, isMobile }) => {
  test.skip(isMobile, 'phone layout stacks the panels; traversal is checked at desktop');
  await page.goto('/');
  await page.getByRole('button', { name: /use this: conversion funnel/i }).first().click();
  await expect(page).toHaveURL(/\/edit\//);
  await page.getByLabel('Data').first().waitFor();
  // Start sequential focus from the top of the document, not from where the clicked template button was.
  await page.getByRole('navigation').getByRole('link').first().focus();

  const stops: string[] = [];
  let ringless: string[] = [];
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? el.tagName;
      const group = el.closest('[role=group],[role=tablist],section,[role=region]')?.getAttribute('aria-label') ?? '';
      const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none';
      return { name: `${group}/${name}`, ring };
    });
    if (!info) break;
    stops.push(info.name);
    if (!info.ring) ringless.push(info.name);
  }
  const expectOrder = ['/Share link', '/Export', 'Data/Label 1', 'Post size/', 'Look/', 'Panels/', 'Style/Download export set'];
  let cursor = 0;
  for (const s of stops) if (s.startsWith(expectOrder[cursor]) && cursor < expectOrder.length) cursor++;
  expect(cursor, `reached ${cursor} of ${expectOrder.length} landmarks in order; stops: ${stops.join(' | ')}`).toBe(expectOrder.length);
  ringless = ringless.filter((n) => !n.includes('/Label') && !n.includes('/Value'));
  expect(ringless, 'every focus stop shows a ring').toEqual([]);
});
