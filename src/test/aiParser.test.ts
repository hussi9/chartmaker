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

  it('provides contextual data for conceptual prompts like crypto and coffee', () => {
    const cryptoResult = parseNaturalLanguagePrompt('Top crypto market cap');
    expect(cryptoResult.data.length).toBeGreaterThan(2);
    expect(cryptoResult.title).toContain('Crypto');

    const coffeeResult = parseNaturalLanguagePrompt('Daily coffee and caffeine');
    expect(coffeeResult.data.length).toBeGreaterThan(2);
    expect(coffeeResult.title).toContain('Caffeine');
  });
});
