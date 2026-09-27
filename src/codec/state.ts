// Share-link codec. A chart travels as gzip + base64url of its spec, validated
// on the way back in. Nothing is stored anywhere: the link is the chart.
import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate';
import { z } from 'zod';
import { CHART_TYPES, PALETTES, defaultSpec, type ChartSpec, type ChartType } from '../chart/types';

export const MAX_PATH_STATE = 8000;
export const MAX_ROWS = 500;

const RowSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(120),
  value: z.number().finite(),
  unit: z.enum(['number', 'percent', 'currency', 'compact']).optional(),
  color: z.string().max(32).optional(),
  group: z.string().max(80).optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
});

export const ChartSpecSchema: z.ZodType<ChartSpec> = z.object({
  v: z.literal(2),
  type: z.enum(CHART_TYPES),
  data: z.array(RowSchema).max(MAX_ROWS),
  text: z.object({ title: z.string().max(200), subtitle: z.string().max(200).optional(), source: z.string().max(120).optional() }),
  size: z.enum(['16:9', '1:1', '9:16', '4:3']),
  look: z.enum(['clean', 'bold', 'dark', 'newsletter']),
  palette: z.array(z.string().max(32)).max(12),
  values: z.enum(['number+pct', 'number', 'none']),
  options: z.object({
    legend: z.boolean(),
    grid: z.boolean(),
    rule: z.union([z.object({ kind: z.literal('avg') }), z.object({ kind: z.literal('value'), value: z.number().finite() })]).optional(),
    depth: z.boolean(),
    showHandle: z.boolean(),
    handle: z.string().max(40).optional(),
    logoDataUrl: z.string().max(300_000).optional(),
    logoCorner: z.enum(['br', 'bl', 'tr', 'tl']).optional(),
    remixedFrom: z.string().max(40).optional(),
    ghost: z.array(RowSchema).max(MAX_ROWS).optional(),
    quadrants: z.tuple([z.string().max(40), z.string().max(40), z.string().max(40), z.string().max(40)]).optional(),
  }),
  callouts: z.array(z.object({ id: z.string().max(64), insightId: z.string().max(64), text: z.string().max(160), anchor: z.object({ rowId: z.string().max(64) }) })).max(12),
  caption: z.object({ text: z.string().max(2000), tone: z.enum(['plain', 'punchy', 'analyst']), edited: z.boolean() }).optional(),
}) as z.ZodType<ChartSpec>;

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return null;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export function encodeState(spec: ChartSpec): string {
  return toBase64Url(gzipSync(strToU8(JSON.stringify(spec)), { level: 9 }));
}

const MAX_INFLATED = 512 * 1024; // a 500-row spec is ~60 KB; anything bigger is not ours

export function decodeState(s: string): ChartSpec | null {
  const bytes = fromBase64Url(s);
  if (!bytes || bytes.length < 10) return null;
  // gzip's trailer carries the inflated size; refuse bombs before touching them.
  const isize = new DataView(bytes.buffer, bytes.byteOffset + bytes.length - 4, 4).getUint32(0, true);
  if (isize > MAX_INFLATED) return null;
  try {
    const parsed = ChartSpecSchema.safeParse(JSON.parse(strFromU8(gunzipSync(bytes, { out: new Uint8Array(isize) }))));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface ShareUrls { path?: string; hash: string; /** Set when the spec cannot be shared; path and hash are then empty. */ error?: string }

export function shareUrls(spec: ChartSpec, origin: string): ShareUrls {
  const ok = ChartSpecSchema.safeParse(spec);
  if (!ok.success) {
    const issue = ok.error.issues[0];
    const where = issue?.path.join('.') ?? '';
    const why = where === 'data' ? `${MAX_ROWS} rows max` : issue?.message ?? 'invalid chart';
    return { hash: '', error: `This chart can't be shared yet: ${why}.` };
  }
  const state = encodeState(spec);
  const base = origin.replace(/\/$/, '');
  return { path: state.length <= MAX_PATH_STATE ? `${base}/s/${state}` : undefined, hash: `${base}/s#${state}` };
}

// ---- Legacy (v1) hash links from the product as of baseline-2026-09-27 ----

const LEGACY_PALETTE: Record<string, string> = {
  cyber: 'spectrum', spotify: 'mint', apple: 'slate', vercel: 'slate', finance: 'slate', bloomberg: 'ember',
  sunset: 'ember', pastel: 'signal', emerald: 'mint', notion: 'signal', crypto: 'ember', monochrome: 'mono',
};

const LegacySchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).optional(),
  chartType: z.string().optional(),
  schemeId: z.string().optional(),
  data: z.array(z.object({ id: z.union([z.string(), z.number()]).optional(), name: z.string().max(120), value: z.number().finite(), color: z.string().max(32).optional() })).max(MAX_ROWS),
  dataSource: z.string().max(120).optional(),
  showAverageLine: z.boolean().optional(),
  creatorHandle: z.string().max(40).optional(),
});

export function decodeLegacyHash(hash: string): ChartSpec | null {
  let clean = hash.startsWith('#') ? hash.slice(1) : hash;
  // The archived product wrote `#state=<b64>`; strip that prefix.
  const at = clean.indexOf('state=');
  if (at >= 0) clean = clean.slice(at + 'state='.length).split('&')[0];
  if (!clean || clean.length < 5) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(decodeURIComponent(atob(clean)));
  } catch {
    return null;
  }
  const parsed = LegacySchema.safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;
  const type = (CHART_TYPES as readonly string[]).includes(p.chartType ?? '') ? (p.chartType as ChartType) : 'bar';
  const paletteId = LEGACY_PALETTE[p.schemeId ?? ''] ?? 'signal';
  const palette = PALETTES.find((x) => x.id === paletteId)?.colors ?? PALETTES[0].colors;
  const spec = defaultSpec({
    type,
    data: p.data.map((d, i) => ({ id: String(d.id ?? i + 1), label: d.name, value: d.value, ...(d.color ? { color: d.color } : {}) })),
    text: { title: p.title ?? '', ...(p.subtitle ? { subtitle: p.subtitle } : {}), ...(p.dataSource ? { source: p.dataSource } : {}) },
    palette: [...palette],
    options: {
      legend: false, grid: true, depth: false,
      showHandle: Boolean(p.creatorHandle),
      ...(p.creatorHandle ? { handle: p.creatorHandle } : {}),
      ...(p.showAverageLine ? { rule: { kind: 'avg' as const } } : {}),
    },
  });
  return ChartSpecSchema.safeParse(spec).success ? spec : null;
}
