import { describe, it, expect } from 'vitest';
import { simulate, safePalette, applyBrand, OKABE_ITO } from '@/chart/cvd';
import { defaultSpec } from '@/chart/types';
import type { BrandDoc } from '@/db';

describe('simulate', () => {
  it('changes a red-green pair under deuteranopia and leaves grey alone', () => {
    expect(simulate('#e26d5a', 'deuteranopia')).not.toBe('#e26d5a');
    expect(simulate('#0e9384', 'protanopia')).not.toBe('#0e9384');
    expect(simulate('#808080', 'tritanopia')).toBe('#808080');
    expect(simulate('#e26d5a', 'deuteranopia')).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('safePalette', () => {
  it('returns as many distinct Okabe-Ito colours as the input, keeping hue order', () => {
    const out = safePalette(['#0e9384', '#1e293b', '#e0a33a', '#e26d5a']);
    expect(out).toHaveLength(4);
    expect(new Set(out).size).toBe(4);
    for (const c of out) expect(OKABE_ITO).toContain(c);
    // the teal input maps to the bluish-green, the amber to orange/yellow
    expect(['#009e73', '#56b4e9', '#0072b2']).toContain(out[0]);
    expect(['#e69f00', '#f0e442']).toContain(out[2]);
  });
  it('caps at the eight Okabe-Ito colours', () => {
    expect(safePalette(Array.from({ length: 12 }, () => '#123456'))).toHaveLength(8);
  });
});

describe('applyBrand', () => {
  const brand: BrandDoc = { id: 'brand', palette: ['#111111', '#222222'], safe: false, handle: 'ada', corner: 'tl', applyToNew: true };
  it('sets the palette, handle, badge and corner', () => {
    const s = applyBrand(defaultSpec(), brand);
    expect(s.palette).toEqual(['#111111', '#222222']);
    expect(s.options).toMatchObject({ showHandle: true, handle: 'ada', logoCorner: 'tl' });
    expect(s.data.every((r) => r.color === undefined)).toBe(true);
  });
  it('uses the safe palette when the brand asks for it', () => {
    const s = applyBrand(defaultSpec(), { ...brand, safe: true });
    for (const c of s.palette) expect(OKABE_ITO).toContain(c);
  });
  it('embeds the logo as a data URL when given', () => {
    const s = applyBrand(defaultSpec(), brand, 'data:image/png;base64,AAAA');
    expect(s.options.logoDataUrl).toBe('data:image/png;base64,AAAA');
  });
});
