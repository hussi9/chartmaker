import { describe, it, expect } from 'vitest';
import { decorateItemWithEmoji } from '../lib/emojiDecorator';

describe('Auto-Emoji Decorator (emojiDecorator)', () => {
  it('decorates common keywords with matching emojis', () => {
    expect(decorateItemWithEmoji('Coffee')).toBe('☕ Coffee');
    expect(decorateItemWithEmoji('Morning Tea')).toBe('🍵 Morning Tea');
    expect(decorateItemWithEmoji('Coding Hours')).toBe('💻 Coding Hours');
    expect(decorateItemWithEmoji('Software Engineer')).toBe('💻 Software Engineer');
    expect(decorateItemWithEmoji('Bug Fixes')).toBe('🐛 Bug Fixes');
    expect(decorateItemWithEmoji('Salary & Compensation')).toBe('💰 Salary & Compensation');
    expect(decorateItemWithEmoji('Monthly Rent')).toBe('🏠 Monthly Rent');
    expect(decorateItemWithEmoji('Groceries')).toBe('🛒 Groceries');
    expect(decorateItemWithEmoji('Crypto portfolio')).toBe('💎 Crypto portfolio');
    expect(decorateItemWithEmoji('Flight to Tokyo')).toBe('🛫 Flight to Tokyo');
    expect(decorateItemWithEmoji('World Travel')).toBe('✈️ World Travel');
  });

  it('is case-insensitive for keyword matching', () => {
    expect(decorateItemWithEmoji('BITCOIN')).toBe('🪙 BITCOIN');
    expect(decorateItemWithEmoji('sPoTiFy')).toBe('🎧 sPoTiFy');
    expect(decorateItemWithEmoji('NETFLIX')).toBe('🍿 NETFLIX');
  });

  it('preserves existing emoji if string already starts with one', () => {
    expect(decorateItemWithEmoji('🔥 High Priority')).toBe('🔥 High Priority');
    expect(decorateItemWithEmoji('🚀 Product Launch')).toBe('🚀 Product Launch');
    expect(decorateItemWithEmoji('☕ Espresso')).toBe('☕ Espresso');
  });

  it('uses fallback sparkle emoji when no keyword is matched', () => {
    expect(decorateItemWithEmoji('Unrecognized Category XYZ')).toBe('✨ Unrecognized Category XYZ');
  });
});
