// Self-Learning Growth & Telemetry Engine for ChartGenie
// Tracks creation patterns, surfaces trending styles, powers viral loops, and collects feedback

export interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: number;
}

export interface UserPreferencesStats {
  chartsCreatedCount: number;
  exportsCount: number;
  popularChartTypes: Record<string, number>;
  popularThemes: Record<string, number>;
  popularAspectRatios: Record<string, number>;
  popularFormats: Record<string, number>;
  recentPrompts: string[];
}

const STORAGE_KEY_PREFS = 'cg_learning_stats_v1';
const STORAGE_KEY_GA_ID = 'cg_custom_ga_id';
const STORAGE_KEY_GSC_TAG = 'cg_custom_gsc_tag';
const STORAGE_KEY_FEEDBACK = 'cg_user_feedback_v1';

// Default initial stats
const defaultStats: UserPreferencesStats = {
  chartsCreatedCount: 0,
  exportsCount: 0,
  popularChartTypes: { bar: 12, pie: 18, line: 15, donut: 10 },
  popularThemes: { apple: 22, linear: 19, midnight: 14, emerald: 8 },
  popularAspectRatios: { '16:9': 35, '1:1': 28, '9:16': 15, '4:3': 12 },
  popularFormats: { png: 45, svg: 22, embed: 8 },
  recentPrompts: [
    'Tech market share 2026',
    'Weekly productivity hours by day',
    'SaaS revenue breakdown Q1-Q4',
    'Favorite coffee roasts preference'
  ]
};

// Retrieve learning statistics
export const getLearningStats = (): UserPreferencesStats => {
  if (typeof window === 'undefined') return defaultStats;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (!raw) return defaultStats;
    return { ...defaultStats, ...JSON.parse(raw) };
  } catch {
    return defaultStats;
  }
};

// Save updated learning statistics
export const saveLearningStats = (stats: UserPreferencesStats) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save learning stats', e);
  }
};

// Record a chart modification or creation in the self-learning model
export const recordChartEvent = (
  chartType: string,
  themeId: string,
  aspectRatio: string
) => {
  const stats = getLearningStats();
  stats.chartsCreatedCount += 1;
  stats.popularChartTypes[chartType] = (stats.popularChartTypes[chartType] || 0) + 1;
  stats.popularThemes[themeId] = (stats.popularThemes[themeId] || 0) + 1;
  stats.popularAspectRatios[aspectRatio] = (stats.popularAspectRatios[aspectRatio] || 0) + 1;
  saveLearningStats(stats);
};

// Record an export event (PNG, SVG, etc.)
export const recordExportEvent = (format: string) => {
  const stats = getLearningStats();
  stats.exportsCount += 1;
  stats.popularFormats = stats.popularFormats || {};
  stats.popularFormats[format] = (stats.popularFormats[format] || 0) + 1;
  saveLearningStats(stats);
};

// Record a successful AI prompt
export const recordAiPrompt = (prompt: string) => {
  if (!prompt || prompt.trim().length < 5) return;
  const stats = getLearningStats();
  const trimmed = prompt.trim();
  const filtered = stats.recentPrompts.filter(p => p.toLowerCase() !== trimmed.toLowerCase());
  stats.recentPrompts = [trimmed, ...filtered].slice(0, 10);
  saveLearningStats(stats);
};

// Get custom GA4 ID if configured by owner/user
export const getCustomGaId = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_GA_ID) || import.meta.env.VITE_GA_MEASUREMENT_ID || '';
};

// Set custom GA4 ID
export const setCustomGaId = (id: string) => {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(STORAGE_KEY_GA_ID);
  } else {
    localStorage.setItem(STORAGE_KEY_GA_ID, id.trim());
  }
};

// Get custom GSC verification tag
export const getCustomGscTag = (): string => {
  if (typeof window === 'undefined') return 'kxx7zMFGyesCFXQhPk6gUlDaXkOLODR8TWWhiIZ9yVQ';
  return localStorage.getItem(STORAGE_KEY_GSC_TAG) || 'kxx7zMFGyesCFXQhPk6gUlDaXkOLODR8TWWhiIZ9yVQ';
};

// Set custom GSC verification tag
export const setCustomGscTag = (tag: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_GSC_TAG, tag.trim());
};

// Feedback record
export interface UserFeedback {
  sentiment: 'positive' | 'negative' | 'neutral';
  comment?: string;
  timestamp: number;
}

export const submitUserFeedback = (sentiment: 'positive' | 'negative' | 'neutral', comment?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEEDBACK);
    const existing: UserFeedback[] = raw ? JSON.parse(raw) : [];
    existing.push({ sentiment, comment, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(existing.slice(-20)));
  } catch (e) {
    console.warn('Feedback save error', e);
  }
};

export const getSavedFeedback = (): UserFeedback[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEEDBACK);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
