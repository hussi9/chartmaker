import { describe, it, expect } from 'vitest';
import { formatValue, formatAxis } from '@/chart/format';

describe('formatValue', () => {
  it('number + share of total', () => expect(formatValue(87, 'number', 'number+pct', 134)).toBe('87 · 65%'));
  it('plain number', () => expect(formatValue(87, 'number', 'number', 134)).toBe('87'));
  it('none', () => expect(formatValue(87, 'number', 'none', 134)).toBe(''));
  it('currency compacts thousands', () => expect(formatValue(1234.5, 'currency', 'number', 0)).toBe('$1.2k'));
  it('currency keeps small values', () => expect(formatValue(12, 'currency', 'number', 0)).toBe('$12'));
  it('percent unit', () => expect(formatValue(0.5, 'percent', 'number', 0)).toBe('0.5%'));
  it('percent unit never doubles up with share', () => expect(formatValue(40, 'percent', 'number+pct', 100)).toBe('40%'));
  it('compact millions', () => expect(formatValue(3400000, 'compact', 'number', 0)).toBe('3.4M'));
  it('compact thousands', () => expect(formatValue(52000, 'compact', 'number', 0)).toBe('52k'));
  it('thousands separators for plain numbers', () => expect(formatValue(52000, 'number', 'number', 0)).toBe('52,000'));
  it('negatives', () => expect(formatValue(-12.5, 'number', 'number', 0)).toBe('-12.5'));
  it('share with zero total', () => expect(formatValue(5, 'number', 'number+pct', 0)).toBe('5'));
  it('decimals limited to one place', () => expect(formatValue(33.456, 'number', 'number', 0)).toBe('33.5'));
});

describe('formatAxis', () => {
  it('compacts large ticks', () => expect(formatAxis(1500000)).toBe('1.5M'));
  it('keeps small ticks', () => expect(formatAxis(45)).toBe('45'));
  it('currency ticks', () => expect(formatAxis(2000, 'currency')).toBe('$2k'));
  it('percent ticks', () => expect(formatAxis(20, 'percent')).toBe('20%'));
});
