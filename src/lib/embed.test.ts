import { describe, expect, it } from 'vitest';
import { canEmbed, embedSnippet } from './embed';

describe('canEmbed', () => {
  it('accepts a path-form share link only', () => {
    expect(canEmbed('https://chartgenie.xyz/s/abc_DEF-1')).toBe(true);
    expect(canEmbed('https://chartgenie.xyz/s#abc')).toBe(false);
    expect(canEmbed(undefined)).toBe(false);
  });
});

describe('embedSnippet', () => {
  it('links to the chart and loads its card image', () => {
    const html = embedSnippet('https://chartgenie.xyz/s/abc', 'Sales by region');
    expect(html).toContain('<a href="https://chartgenie.xyz/s/abc"><img src="https://chartgenie.xyz/s/abc/og.png"');
    expect(html).toContain('alt="Sales by region"');
    expect(html).toContain('nothing is stored on a server');
  });

  it('escapes attribute-breaking characters in the alt text and falls back when blank', () => {
    const html = embedSnippet('https://chartgenie.xyz/s/abc', '"><script>x</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
    expect(embedSnippet('https://chartgenie.xyz/s/abc', '   ')).toContain('alt="Chart made with ChartGenie"');
  });
});
