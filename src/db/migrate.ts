// One-time import of the v1 localStorage library into Dexie. The old keys are
// renamed, never deleted, so nothing is lost if this ever has to run again.
import { z } from 'zod';
import { db, storageState } from './index';
import { CHART_TYPES, PALETTES, defaultSpec, type ChartType, type LookId, type PostSizeId } from '../chart/types';
import { ChartSpecSchema } from '../codec/state';

export const LEGACY_KEYS = { charts: 'chartgenie_saved_charts_v1', autosave: 'chartgenie_autosave_v1' } as const;

const LEGACY_PALETTE: Record<string, string> = {
  cyber: 'spectrum', spotify: 'mint', apple: 'slate', vercel: 'slate', finance: 'slate', bloomberg: 'ember',
  sunset: 'ember', pastel: 'signal', emerald: 'mint', notion: 'signal', crypto: 'ember', monochrome: 'mono',
};
const DARK_MODES = new Set(['dark', 'pure-dark', 'spotify', 'slate']);

const LegacyChart = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  chartType: z.string().optional(),
  schemeId: z.string().optional(),
  aspectRatio: z.string().optional(),
  bgMode: z.string().optional(),
  showLegend: z.boolean().optional(),
  showValues: z.boolean().optional(),
  is3d: z.boolean().optional(),
  creatorHandle: z.string().optional(),
  dataSource: z.string().optional(),
  showAverageLine: z.boolean().optional(),
  data: z.array(z.object({ id: z.union([z.string(), z.number()]).optional(), name: z.string(), value: z.number(), color: z.string().optional() })).optional(),
  updatedAt: z.number().optional(),
});

export function legacyToSpec(raw: unknown): { id: string; spec: ReturnType<typeof defaultSpec>; updatedAt: number } | null {
  const p = LegacyChart.safeParse(raw);
  if (!p.success) return null;
  const c = p.data;
  const type = (CHART_TYPES as readonly string[]).includes(c.chartType ?? '') ? (c.chartType as ChartType) : 'bar';
  const size = (['16:9', '1:1', '9:16', '4:3'] as const).includes(c.aspectRatio as PostSizeId) ? (c.aspectRatio as PostSizeId) : '16:9';
  const look: LookId = DARK_MODES.has(c.bgMode ?? '') ? 'dark' : 'clean';
  const paletteId = LEGACY_PALETTE[c.schemeId ?? ''] ?? 'signal';
  const palette = PALETTES.find((x) => x.id === paletteId)?.colors ?? PALETTES[0].colors;
  const handle = c.creatorHandle?.replace(/^@/, '').trim();
  const spec = defaultSpec({
    type,
    size,
    look,
    palette: [...palette],
    values: c.showValues === false ? 'none' : 'number+pct',
    data: (c.data ?? []).map((d, i) => ({ id: String(d.id ?? i + 1), label: d.name, value: d.value, ...(d.color ? { color: d.color } : {}) })),
    text: { title: c.title ?? '', ...(c.subtitle ? { subtitle: c.subtitle } : {}), ...(c.dataSource ? { source: c.dataSource } : {}) },
    options: {
      legend: Boolean(c.showLegend),
      grid: true,
      depth: Boolean(c.is3d),
      showHandle: Boolean(handle),
      ...(handle ? { handle } : {}),
      ...(c.showAverageLine ? { rule: { kind: 'avg' as const } } : {}),
    },
  });
  if (!ChartSpecSchema.safeParse(spec).success) return null;
  return { id: c.id && c.id.length > 0 ? c.id : `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, spec, updatedAt: c.updatedAt ?? Date.now() };
}

function readKey(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function retireKey(key: string): void {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return;
    localStorage.setItem(`${key}_migrated`, raw);
    localStorage.removeItem(key);
  } catch { /* storage may be read-only; the import already succeeded */ }
}

export async function migrateFromLocalStorage(): Promise<number> {
  if (storageState() !== 'ok' || typeof localStorage === 'undefined') return 0;
  const entries = [...readKey(LEGACY_KEYS.charts), ...readKey(LEGACY_KEYS.autosave)];
  let n = 0;
  const now = Date.now();
  for (const raw of entries) {
    const conv = legacyToSpec(raw);
    if (!conv) continue;
    const existing = await db.charts.get(conv.id);
    if (existing) continue;
    await db.charts.put({ id: conv.id, spec: conv.spec, createdAt: conv.updatedAt, updatedAt: conv.updatedAt });
    n++;
  }
  retireKey(LEGACY_KEYS.charts);
  retireKey(LEGACY_KEYS.autosave);
  if (n > 0) {
    const s = (await db.settings.get('settings')) ?? { id: 'settings' as const };
    await db.settings.put({ ...s, migratedAt: now });
  }
  return n;
}
