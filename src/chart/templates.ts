// The gallery's cards: one finished look per chart type (its sample rows) plus
// the sample datasets from the previous version. All of it is labelled sample.
import { CHART_TYPES, defaultSpec, type ChartSpec, type ChartType, type LookId } from './types';
import { PLOTS, type PlotCategory } from './plots';
import { LEGACY_PRESETS } from './legacy-presets';

export type TemplateCategory = PlotCategory | 'viral' | 'tech' | 'finance' | 'business';

export interface Template { id: string; name: string; type: ChartType; category: TemplateCategory; spec: ChartSpec; blurb: string; sample: true }

// The seven the design leads with, in its order.
export const POPULAR: ChartType[] = ['funnel', 'line', 'horizontalBar', 'kpi', 'bar', 'donut', 'matrix'];

const LOOK_FOR_TYPE: Partial<Record<ChartType, LookId>> = { line: 'dark', kpi: 'clean', stackedArea: 'bold' };

function typeTemplate(type: ChartType): Template {
  const def = PLOTS[type];
  const look = LOOK_FOR_TYPE[type] ?? 'clean';
  return {
    id: `look-${type}`,
    name: look === 'dark' ? `${def.name} · Dark` : def.name,
    type,
    category: def.category,
    blurb: def.blurb,
    sample: true,
    spec: defaultSpec({ type, look, data: def.sample.map((r) => ({ ...r })), text: { title: def.name, subtitle: def.blurb, source: 'sample data' } }),
  };
}

export const TEMPLATES: Template[] = [
  ...CHART_TYPES.map(typeTemplate),
  ...LEGACY_PRESETS.map((p) => ({
    id: `preset-${p.key}`,
    name: p.title,
    type: p.type,
    category: p.category,
    blurb: p.subtitle,
    sample: true as const,
    spec: defaultSpec({ type: p.type, data: p.rows.map((r) => ({ ...r })), text: { title: p.title, subtitle: p.subtitle, source: 'sample data' } }),
  })),
];

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | 'popular' | 'all'; label: string }[] = [
  { id: 'popular', label: 'Popular' }, { id: 'bars', label: 'Bars' }, { id: 'trends', label: 'Trends' }, { id: 'compare', label: 'Compare' },
  { id: 'kpis', label: 'KPIs' }, { id: 'funnels', label: 'Funnels' }, { id: 'matrix', label: 'Matrix' }, { id: 'all', label: `All · ${CHART_TYPES.length}` },
  { id: 'viral', label: 'Viral' }, { id: 'tech', label: 'Tech' }, { id: 'finance', label: 'Finance' }, { id: 'business', label: 'Business' },
];

export function filterTemplates(cat: TemplateCategory | 'popular' | 'all', query: string): Template[] {
  const q = query.trim().toLowerCase();
  return TEMPLATES.filter((t) => {
    const inCat = cat === 'all' ? true : cat === 'popular' ? POPULAR.includes(t.type) && t.id.startsWith('look-') : t.category === cat;
    if (!inCat) return false;
    if (!q) return true;
    return `${t.name} ${t.blurb} ${PLOTS[t.type].name} ${t.category}`.toLowerCase().includes(q);
  }).sort((a, b) => (cat === 'popular' ? POPULAR.indexOf(a.type) - POPULAR.indexOf(b.type) : 0));
}
