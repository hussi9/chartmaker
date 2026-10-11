import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

describe('optional Vercel page monitoring integration', () => {
  it('uses the consent gate and leaves Speed Insights disabled on the editor', async () => {
    const component = await readFile(resolve(process.cwd(), 'src/components/MeasurementConsent.tsx'), 'utf8');
    const monitoring = await readFile(resolve(process.cwd(), 'src/lib/browser-monitoring.js'), 'utf8');
    expect(component).toMatch(/installMonitoring/);
    expect(component).toMatch(/vercelWebAllowed/);
    expect(component).toMatch(/speedRoute:\s*\(\)\s*=>\s*null/);
    expect(monitoring).toContain('/_vercel/insights/script.js');
  });
});
