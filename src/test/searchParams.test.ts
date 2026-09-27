import { describe, it, expect } from 'vitest';
import { stringParam, boolParam } from '@/lib/searchParams';

describe('stringParam', () => {
  it('passes through an ordinary string', () => {
    expect(stringParam({ text: 'hello' }, 'text', 100)).toBe('hello');
  });
  it('survives numeric coercion ("2024" arriving as the number 2024)', () => {
    expect(stringParam({ text: 2024 }, 'text', 100)).toBe('2024');
  });
  it('survives boolean coercion ("true"/"false" arriving as real booleans)', () => {
    expect(stringParam({ text: true }, 'text', 100)).toBe('true');
    expect(stringParam({ text: false }, 'text', 100)).toBe('false');
  });
  it('treats missing and empty as absent', () => {
    expect(stringParam({}, 'text', 100)).toBeUndefined();
    expect(stringParam({ text: '' }, 'text', 100)).toBeUndefined();
  });
  it('truncates to maxLen', () => {
    expect(stringParam({ text: 'abcdef' }, 'text', 3)).toBe('abc');
  });
  it('ignores an object/array value', () => {
    expect(stringParam({ text: { a: 1 } }, 'text', 100)).toBeUndefined();
  });
});

describe('boolParam', () => {
  it.each([
    [{ templates: true }, true],
    [{ templates: 1 }, true],
    [{ templates: '1' }, true],
    [{ templates: 'true' }, true],
    [{ templates: false }, false],
    [{ templates: '0' }, false],
    [{}, false],
  ])('%j -> %s', (input, expected) => {
    expect(boolParam(input, 'templates')).toBe(expected);
  });
});
