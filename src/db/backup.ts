// Whole-library backup as one JSON file. Blobs travel as base64 with their type.
import { z } from 'zod';
import { db, type BrandDoc, type ChartDoc, type SeriesDoc, type SettingsDoc } from './index';
import { ChartSpecSchema } from '../codec/state';

export class BackupError extends Error {
  constructor(message: string) { super(message); this.name = 'BackupError'; }
}

interface BlobJson { type: string; base64: string }
interface BackupJson {
  version: 1;
  exportedAt: number;
  charts: (Omit<ChartDoc, 'thumb'> & { thumb?: BlobJson })[];
  series: SeriesDoc[];
  brand: (Omit<BrandDoc, 'logo'> & { logo?: BlobJson }) | null;
  settings: SettingsDoc | null;
}

// jsdom's Blob lacks arrayBuffer()/text(); FileReader works everywhere.
export function blobBytes(b: Blob): Promise<Uint8Array> {
  if (typeof b.arrayBuffer === 'function') return b.arrayBuffer().then((ab) => new Uint8Array(ab));
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(new Uint8Array(fr.result as ArrayBuffer));
    fr.onerror = () => reject(fr.error);
    fr.readAsArrayBuffer(b);
  });
}

export function blobText(b: Blob): Promise<string> {
  if (typeof b.text === 'function') return b.text();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsText(b);
  });
}

async function blobToJson(b: Blob | undefined): Promise<BlobJson | undefined> {
  if (!b) return undefined;
  const bytes = await blobBytes(b);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { type: b.type, base64: btoa(bin) };
}

function jsonToBlob(j: BlobJson | undefined): Blob | undefined {
  if (!j) return undefined;
  const bin = atob(j.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: j.type });
}

export async function exportBackup(): Promise<Blob> {
  const [charts, series, brand, settings] = await Promise.all([db.charts.toArray(), db.series.toArray(), db.brand.get('brand'), db.settings.get('settings')]);
  const out: BackupJson = {
    version: 1,
    exportedAt: Date.now(),
    charts: await Promise.all(charts.map(async ({ thumb, ...c }) => ({ ...c, thumb: await blobToJson(thumb) }))),
    series,
    brand: brand ? { ...brand, logo: await blobToJson(brand.logo) } : null,
    settings: settings ?? null,
  };
  return new Blob([JSON.stringify(out)], { type: 'application/json' });
}

const BlobJsonSchema = z.object({ type: z.string(), base64: z.string() });
const RowsSchema = z.array(z.object({ id: z.string(), label: z.string(), value: z.number() }).passthrough()).max(500);

const BackupSchema = z.object({
  version: z.literal(1),
  charts: z.array(z.object({ id: z.string().min(1), spec: ChartSpecSchema, createdAt: z.number(), updatedAt: z.number(), sharedAt: z.number().optional(), sharedUrl: z.string().optional(), thumb: BlobJsonSchema.optional() })),
  series: z.array(z.object({ id: z.string().min(1), chartId: z.string(), cadence: z.enum(['weekly', 'monthly', 'quarterly']), nextDue: z.number(), snapshots: z.array(z.object({ at: z.number(), rows: RowsSchema })), notifiedAt: z.number().optional() })).default([]),
  brand: z.object({ id: z.literal('brand'), palette: z.array(z.string()), safe: z.boolean(), handle: z.string().optional(), corner: z.enum(['br', 'bl', 'tr', 'tl']), applyToNew: z.boolean(), logo: BlobJsonSchema.optional() }).nullable().default(null),
  settings: z.object({ id: z.literal('settings'), handle: z.string().optional(), lastRoute: z.string().optional(), migratedAt: z.number().optional() }).nullable().default(null),
});

export async function importBackup(file: Blob, mode: 'merge' | 'replace'): Promise<{ charts: number; series: number }> {
  let raw: unknown;
  try {
    raw = JSON.parse(await blobText(file));
  } catch {
    throw new BackupError('That file is not a ChartGenie backup (invalid JSON).');
  }
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) throw new BackupError('That file is not a ChartGenie backup (unexpected contents).');
  const b = parsed.data;
  await db.transaction('rw', db.charts, db.series, db.brand, db.settings, async () => {
    if (mode === 'replace') {
      await Promise.all([db.charts.clear(), db.series.clear(), db.brand.clear(), db.settings.clear()]);
    }
    for (const c of b.charts) {
      if (mode === 'merge' && (await db.charts.get(c.id))) continue;
      const { thumb, ...rest } = c;
      await db.charts.put({ ...rest, thumb: jsonToBlob(thumb) });
    }
    for (const s of b.series) {
      if (mode === 'merge' && (await db.series.get(s.id))) continue;
      await db.series.put(s as SeriesDoc);
    }
    if (b.brand && (mode === 'replace' || !(await db.brand.get('brand')))) {
      const { logo, ...rest } = b.brand;
      await db.brand.put({ ...rest, logo: jsonToBlob(logo) });
    }
    if (b.settings && (mode === 'replace' || !(await db.settings.get('settings')))) await db.settings.put(b.settings);
  });
  return { charts: b.charts.length, series: b.series.length };
}
