// The one data model every screen, export and server function shares.
// A chart is a pure function of a ChartSpec. Nothing here touches the DOM.

export const CHART_TYPES = [
  'pie', 'donut', 'bar', 'horizontalBar',
  'stackedBar', 'stackedColumn', 'stackedHorizontal',
  'line', 'stackedLine', 'area', 'stackedArea',
  'radar', 'scatter', 'heatmap', 'threshold', 'gauge', 'funnel',
  'kpi', 'matrix',
] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export type PostSizeId = '16:9' | '1:1' | '9:16' | '4:3';
export interface PostSize { id: PostSizeId; w: number; h: number; label: string; platform: string }
export const POST_SIZES: Record<PostSizeId, PostSize> = {
  '16:9': { id: '16:9', w: 1600, h: 900, label: 'X / Web', platform: 'x' },
  '1:1': { id: '1:1', w: 1080, h: 1080, label: 'LinkedIn', platform: 'linkedin' },
  '9:16': { id: '9:16', w: 1080, h: 1920, label: 'Story', platform: 'instagram' },
  '4:3': { id: '4:3', w: 1600, h: 1200, label: 'Deck', platform: 'deck' },
};
export const POST_SIZE_IDS = Object.keys(POST_SIZES) as PostSizeId[];

export type LookId = 'clean' | 'bold' | 'dark' | 'newsletter';
export type Unit = 'number' | 'percent' | 'currency' | 'compact';
export type ValuesMode = 'number+pct' | 'number' | 'none';
export type Tone = 'plain' | 'punchy' | 'analyst';

export interface Row {
  id: string;
  label: string;
  value: number;
  unit?: Unit;
  color?: string;
  group?: string;
  x?: number;
  y?: number;
}

export interface Callout { id: string; insightId: string; text: string; anchor: { rowId: string } }

export interface ChartRule { kind: 'avg' }
export interface ChartValueRule { kind: 'value'; value: number }

export interface ChartOptions {
  legend: boolean;
  grid: boolean;
  rule?: ChartRule | ChartValueRule;
  depth: boolean;
  showHandle: boolean;
  handle?: string;
  logoDataUrl?: string;
  logoCorner?: 'br' | 'bl' | 'tr' | 'tl';
  remixedFrom?: string;
  ghost?: Row[];
  quadrants?: [string, string, string, string];
}

export interface ChartCaption { text: string; tone: Tone; edited: boolean }

export interface ChartSpec {
  v: 2;
  type: ChartType;
  data: Row[];
  text: { title: string; subtitle?: string; source?: string };
  size: PostSizeId;
  look: LookId;
  palette: string[];
  values: ValuesMode;
  options: ChartOptions;
  callouts: Callout[];
  caption?: ChartCaption;
}

export interface LookTokens {
  bg: string;
  ink: string;
  muted: string;
  grid: string;
  line: string;
  radius: number;
  title: number;
  subtitle: number;
  label: number;
  value: number;
  barGap: number;
  border?: string;
}

const clean: LookTokens = {
  bg: '#ffffff', ink: '#1e293b', muted: '#6b7280', grid: '#e3ded6', line: '#d6d0c6',
  radius: 6, title: 30, subtitle: 13, label: 15, value: 15, barGap: 0.25,
};
export const LOOKS: Record<LookId, LookTokens> = {
  clean,
  bold: { ...clean, title: 40, label: 18, value: 18, barGap: 0.12 },
  dark: { ...clean, bg: '#1e293b', ink: '#f6f3ee', muted: '#cbd5e1', grid: '#334155', line: '#475569' },
  newsletter: { ...clean, border: '#1e293b', radius: 0 },
};

export interface Palette { id: string; name: string; colors: string[] }
export const PALETTES: Palette[] = [
  { id: 'signal', name: 'Signal', colors: ['#0e9384', '#1e293b', '#e0a33a', '#e26d5a'] },
  { id: 'slate', name: 'Slate', colors: ['#1e293b', '#475569', '#94a3b8', '#cbd5e1'] },
  { id: 'spectrum', name: 'Spectrum', colors: ['#4f9dd9', '#7c3aed', '#ec4899', '#f59e0b'] },
  { id: 'mint', name: 'Mint', colors: ['#0e9384', '#2dd4bf', '#99f6e4', '#1e293b'] },
  { id: 'ember', name: 'Ember', colors: ['#e26d5a', '#e0a33a', '#1e293b', '#d6d0c6'] },
  { id: 'mono', name: 'Mono', colors: ['#1e293b', '#1e293bcc', '#1e293b99', '#1e293b66'] },
];

// Illustrative sample. Every screen that seeds it labels it as sample data.
export const SAMPLE_ROWS: Row[] = [
  { id: 's1', label: 'USA', value: 87 },
  { id: 's2', label: 'Italy', value: 20 },
  { id: 's3', label: 'UK', value: 12 },
  { id: 's4', label: 'Ireland', value: 15 },
];
export const SAMPLE_TITLE = 'Countries';

export function defaultSpec(partial: Partial<ChartSpec> = {}): ChartSpec {
  return {
    v: 2,
    type: 'bar',
    data: SAMPLE_ROWS.map((r) => ({ ...r })),
    text: { title: SAMPLE_TITLE },
    size: '16:9',
    look: 'clean',
    palette: [...PALETTES[0].colors],
    values: 'number+pct',
    options: { legend: false, grid: true, depth: false, showHandle: false },
    callouts: [],
    ...partial,
  };
}
