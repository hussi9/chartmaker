import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { csvString } from '@/export/csv';
import { svgBlob } from '@/export/svg';
import { buildExportSet, exportFileStem } from '@/export/exportSet';
import { defaultSpec } from '@/chart/types';
import '@/chart/render/fonts.node';
import { blobText } from '@/db/backup';

vi.mock('@/export/png', () => ({
  pngBlob: vi.fn(async (_spec: unknown, size: string) => new Blob([`png:${size}`], { type: 'image/png' })),
}));

describe('csvString', () => {
  it('writes a header and quotes commas and quotes', () => {
    const out = csvString([{ id: 'a', label: 'Rent, utilities', value: 1200 }, { id: 'b', label: 'Say "hi"', value: -4.5, unit: 'percent' }]);
    expect(out.split('\n')).toEqual(['label,value,unit', '"Rent, utilities",1200,', '"Say ""hi""",-4.5,percent']);
  });
});

describe('svgBlob', () => {
  it('is a real SVG with embedded fonts', async () => {
    const b = svgBlob(defaultSpec(), '1:1');
    expect(b.type).toBe('image/svg+xml');
    expect(b.size).toBeGreaterThan(20_000);
    const text = await blobText(b);
    expect(text).toMatch(/^<svg xmlns=/);
    expect(text).toContain('viewBox="0 0 1080 1080"');
    expect(text.match(/@font-face/g)).toHaveLength(3);
  });
});

describe('exportFileStem', () => {
  it('slugifies the title and falls back', () => {
    expect(exportFileStem('Countries: Q1 / 2026!')).toBe('countries-q1-2026');
    expect(exportFileStem('   ')).toBe('chart');
  });
});

describe('buildExportSet', () => {
  it('zips PNG + SVG per size plus caption and alt text', async () => {
    const progress: [number, number][] = [];
    const zip = await buildExportSet(defaultSpec(), ['16:9', '1:1'], 'A caption.', 'Alt text here', (d, t) => progress.push([d, t]));
    expect(zip.type).toBe('application/zip');
    const z = await JSZip.loadAsync(zip);
    const names = Object.keys(z.files).sort();
    expect(names).toEqual(['alt-text.txt', 'caption.txt', 'countries-16x9.png', 'countries-16x9.svg', 'countries-1x1.png', 'countries-1x1.svg']);
    expect(await z.file('caption.txt')!.async('string')).toBe('A caption.');
    expect(await z.file('alt-text.txt')!.async('string')).toBe('Alt text here');
    expect(await z.file('countries-1x1.png')!.async('string')).toBe('png:1:1');
    expect(progress.at(-1)).toEqual([4, 4]);
  });
});
