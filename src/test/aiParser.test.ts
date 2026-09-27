import { describe, it, expect } from 'vitest';
import { parseNaturalLanguagePrompt } from '../lib/aiParser';

describe('AI Natural Language Parser (aiParser)', () => {
  it('parses explicit label-value pairs with colon and suffixes (M, k)', () => {
    const input = 'Tesla: 1.8M, Ford: 4.4M, BYD: 3.0M';
    const result = parseNaturalLanguagePrompt(input);

    expect(result.data).toHaveLength(3);
    expect(result.data[0].name).toBe('Tesla');
    expect(result.data[0].value).toBe(1800000);
    expect(result.data[1].name).toBe('Ford');
    expect(result.data[1].value).toBe(4400000);
    expect(result.data[2].name).toBe('BYD');
    expect(result.data[2].value).toBe(3000000);
  });

  it('keeps the first metric after an introductory title', () => {
    const result = parseNaturalLanguagePrompt('Website traffic: Organic 4200, Social 1800, Referral 950, Email 600');
    expect(result.title).toBe('Website traffic');
    expect(result.data.map(({ name, value }) => [name, value])).toEqual([
      ['Organic', 4200], ['Social', 1800], ['Referral', 950], ['Email', 600]
    ]);
    expect(result.subtitle).toMatch(/4 .*rows/i);
  });

  it('parses currency and percentage values', () => {
    const input = 'Rent: $1500\nFood: $450\nSavings: $600\nFun: $200';
    const result = parseNaturalLanguagePrompt(input);

    expect(result.data).toHaveLength(4);
    expect(result.data[0].name).toBe('Rent');
    expect(result.data[0].value).toBe(1500);
    expect(result.data[1].name).toBe('Food');
    expect(result.data[1].value).toBe(450);
  });

  it('auto-recommends a line chart for time series patterns', () => {
    const input = 'Q1: 100, Q2: 250, Q3: 400, Q4: 700';
    const result = parseNaturalLanguagePrompt(input);

    expect(result.recommendedType).toBe('line');
  });

  it('auto-recommends donut or pie for percentage splits close to 100%', () => {
    const input = 'Chrome: 65%, Safari: 20%, Edge: 10%, Others: 5%';
    const result = parseNaturalLanguagePrompt(input);

    expect(['donut', 'pie']).toContain(result.recommendedType);
  });

  it('does not invent metrics for topic-only prompts', () => {
    const result = parseNaturalLanguagePrompt('Top crypto market cap');
    expect(result.data).toEqual([]);
    expect(result.subtitle).toMatch(/enter.*values|no .*pairs/i);
  });
});
