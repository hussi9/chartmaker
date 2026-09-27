import { test, expect } from '@playwright/test';
import JSZip from 'jszip';

function pngSize(buf: Buffer): { w: number; h: number } {
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

test('export set downloads a zip with true-size PNGs and SVGs', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: /use this: conversion funnel/i }).first().click();
  await expect(page).toHaveURL(/\/edit\//);
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    page.getByRole('button', { name: /download export set/i }).click(),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const { readFileSync } = await import('node:fs');
  const zip = await JSZip.loadAsync(readFileSync(path!));
  const names = Object.keys(zip.files).sort();
  expect(names).toContain('caption.txt');
  expect(names).toContain('alt-text.txt');
  const png169 = await zip.file(/-16x9\.png$/)[0].async('nodebuffer');
  const png11 = await zip.file(/-1x1\.png$/)[0].async('nodebuffer');
  expect(pngSize(png169)).toEqual({ w: 3200, h: 1800 });
  expect(pngSize(png11)).toEqual({ w: 2160, h: 2160 });
  const svg = await zip.file(/-16x9\.svg$/)[0].async('string');
  expect(svg).toContain('viewBox="0 0 1600 900"');
  expect(svg).toContain('@font-face');
});
