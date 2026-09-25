import React, { useState, useRef } from 'react';
import {
  Check,
  ChevronDown,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
  FileSpreadsheet,
  Upload,
  ArrowUpDown,
  Shuffle,
  RotateCcw,
  Copy,
  ChevronUp,
  AtSign,
  Download,
  Share2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  ExternalLink,
  Activity,
  Globe
} from 'lucide-react';
import type { DataItem, ColorScheme, AspectRatio, FontFamily, CanvasThemeMode } from '../lib/chartPresets';
import { COLOR_SCHEMES } from '../lib/chartPresets';
import { triggerHaptic } from '../lib/haptics';
import Papa from 'papaparse';
import {
  getLearningStats,
  getCustomGaId,
  setCustomGaId,
  getCustomGscTag,
  setCustomGscTag,
  submitUserFeedback
} from '../lib/learningLoop';
import { initGoogleAnalytics, trackEvent } from '../lib/gtag';

export interface ControlPanelProps {
  activeTab: 'content' | 'style' | 'settings';
  onChangeTab: (tab: 'content' | 'style' | 'settings') => void;
  // Content Tab
  title: string;
  onChangeTitle: (val: string) => void;
  subtitle: string;
  onChangeSubtitle: (val: string) => void;
  data: DataItem[];
  onChangeData: (data: DataItem[]) => void;
  onOpenAiPrompt: () => void;
  onAutoEmoji: () => void;
  onNotify?: (text: string, type?: 'success' | 'info' | 'viral') => void;
  // Settings Tab
  activeScheme: ColorScheme;
  onSelectScheme: (scheme: ColorScheme) => void;
  fontFamily: FontFamily;
  onChangeFontFamily: (font: FontFamily) => void;
  fontSize: 'small' | 'medium' | 'large';
  onChangeFontSize: (size: 'small' | 'medium' | 'large') => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  is3d: boolean;
  onToggle3d: () => void;
  showWatermark: boolean;
  onToggleWatermark: () => void;
  creatorHandle?: string;
  onChangeCreatorHandle?: (handle: string) => void;
  calloutMetric?: string;
  onChangeCalloutMetric?: (metric: string) => void;
  bgMode: CanvasThemeMode;
  onChangeBgMode: (mode: CanvasThemeMode) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
}

// 6 primary swatches matching reference image
const PRESET_SWATCHES: { id: string; name: string; bgStyle: string; schemeId: string }[] = [
  {
    id: 'blue',
    name: 'Classic Royal Blue',
    bgStyle: '#2563eb',
    schemeId: 'apple'
  },
  {
    id: 'gold',
    name: 'Warm Gold',
    bgStyle: '#f59e0b',
    schemeId: 'sunset'
  },
  {
    id: 'purple',
    name: 'Lavender Purple',
    bgStyle: '#8b5cf6',
    schemeId: 'notion'
  },
  {
    id: 'berry',
    name: 'Berry Vibrant',
    bgStyle: 'conic-gradient(#ec4899 0deg 90deg, #f59e0b 90deg 180deg, #8b5cf6 180deg 270deg, #06b6d4 270deg 360deg)',
    schemeId: 'spotify'
  },
  {
    id: 'tricolor',
    name: 'Tricolor Matrix',
    bgStyle: 'conic-gradient(#ef4444 0deg 120deg, #f59e0b 120deg 240deg, #10b981 240deg 360deg)',
    schemeId: 'finance'
  },
  {
    id: 'rainbow',
    name: 'Rainbow Gradient',
    bgStyle: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 50%, #fde047 100%)',
    schemeId: 'cyber'
  }
];

const ASPECT_CARDS: { ratio: AspectRatio; name: string; tag: string; boxW: number; boxH: number }[] = [
  {
    ratio: '16:9',
    name: '16:9 Landscape',
    tag: 'X / LinkedIn / YouTube',
    boxW: 24,
    boxH: 14
  },
  {
    ratio: '1:1',
    name: '1:1 Square',
    tag: 'Instagram Feed / Post',
    boxW: 17,
    boxH: 17
  },
  {
    ratio: '9:16',
    name: '9:16 Vertical',
    tag: 'TikTok / Story / Reel',
    boxW: 13,
    boxH: 24
  },
  {
    ratio: '4:3',
    name: '4:3 Presentation',
    tag: 'Keynote / Slide Deck',
    boxW: 20,
    boxH: 15
  }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  activeTab,
  onChangeTab,
  title,
  onChangeTitle,
  subtitle,
  onChangeSubtitle,
  data,
  onChangeData,
  onOpenAiPrompt,
  onAutoEmoji,
  onNotify,
  activeScheme,
  onSelectScheme,
  fontFamily,
  onChangeFontFamily,
  fontSize,
  onChangeFontSize,
  showLabels,
  onToggleLabels,
  showLegend,
  onToggleLegend,
  showGrid,
  onToggleGrid,
  is3d,
  onToggle3d,
  showWatermark,
  onToggleWatermark,
  creatorHandle = '',
  onChangeCreatorHandle,
  calloutMetric = '',
  onChangeCalloutMetric,
  bgMode,
  onChangeBgMode,
  aspectRatio,
  onChangeAspectRatio
}) => {
  const [showCsvBox, setShowCsvBox] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Analytics & SEO configuration state
  const [gaId, setGaId] = useState(getCustomGaId());
  const [gscTag, setGscTag] = useState(getCustomGscTag());
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const stats = getLearningStats();

  const handleSaveGaId = () => {
    triggerHaptic('light');
    setCustomGaId(gaId);
    initGoogleAnalytics(gaId);
    onNotify?.('Saved Google Analytics Measurement ID!', 'success');
  };

  const handleSaveGscTag = () => {
    triggerHaptic('light');
    setCustomGscTag(gscTag);
    onNotify?.('Saved Google Search Console tag!', 'success');
  };

  const handleCopyGscMeta = () => {
    triggerHaptic('light');
    const metaTag = `<meta name="google-site-verification" content="${gscTag}" />`;
    navigator.clipboard.writeText(metaTag);
    onNotify?.('Copied GSC verification meta tag!', 'success');
  };

  const handleFeedback = (sentiment: 'positive' | 'negative') => {
    triggerHaptic('success');
    submitUserFeedback(sentiment);
    trackEvent('user_feedback', 'CSAT', sentiment);
    setFeedbackSent(sentiment);
    onNotify?.(sentiment === 'positive' ? 'Thanks for the love! ❤️' : 'Thanks! We are improving daily.', 'info');
  };

  const handleCopyShareLink = () => {
    triggerHaptic('light');
    const shareUrl = 'https://chartgenie.xyz/?utm_source=studio_share&utm_medium=viral_link';
    navigator.clipboard.writeText(shareUrl);
    onNotify?.('Copied viral studio share link!', 'viral');
  };

  // Quick stats
  const total = data.reduce((acc, curr) => acc + (typeof curr.value === 'number' ? curr.value : 0), 0);
  const avg = data.length > 0 ? (total / data.length).toFixed(1) : '0';

  // Handle cell edit
  const handleUpdateItem = (id: string, field: 'name' | 'value' | 'color', value: string | number) => {
    onChangeData(data.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    triggerHaptic('light');
    const newId = `item_${Date.now()}`;
    const nextNum = Math.floor(Math.random() * 40) + 15;
    onChangeData([...data, { id: newId, name: `Item ${data.length + 1}`, value: nextNum }]);
  };

  const handleDeleteItem = (id: string) => {
    triggerHaptic('light');
    if (data.length <= 1) return;
    onChangeData(data.filter(item => item.id !== id));
  };

  const handleDuplicateRow = (id: string) => {
    triggerHaptic('light');
    const idx = data.findIndex(i => i.id === id);
    if (idx === -1) return;
    const item = data[idx];
    const copyItem: DataItem = {
      ...item,
      id: `copy_${Date.now()}`,
      name: `${item.name} (Copy)`
    };
    const nextData = [...data];
    nextData.splice(idx + 1, 0, copyItem);
    onChangeData(nextData);
    onNotify?.(`Duplicated "${item.name}"`, 'info');
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    triggerHaptic('light');
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;
    const nextData = [...data];
    const [moved] = nextData.splice(index, 1);
    nextData.splice(targetIndex, 0, moved);
    onChangeData(nextData);
  };

  const handleSortToggle = () => {
    triggerHaptic('light');
    const nextAsc = !sortAsc;
    setSortAsc(nextAsc);
    const sorted = [...data].sort((a, b) => nextAsc ? a.value - b.value : b.value - a.value);
    onChangeData(sorted);
    onNotify?.(`Sorted ${nextAsc ? 'Lowest to Highest' : 'Highest to Lowest'}`, 'info');
  };

  const handleShuffle = () => {
    triggerHaptic('light');
    const shuffled = data.map(item => ({
      ...item,
      value: Math.floor(Math.random() * 85) + 10
    }));
    onChangeData(shuffled);
    onNotify?.('Randomized data values', 'info');
  };

  const handleResetSample = () => {
    triggerHaptic('medium');
    onChangeData([
      { id: '1', name: 'USA', value: 50 },
      { id: '2', name: 'Italy', value: 16 },
      { id: '3', name: 'UK', value: 15 },
      { id: '4', name: 'Ireland', value: 19 }
    ]);
    onChangeTitle('Countries');
    onChangeSubtitle('');
    onNotify?.('Reset to standard starter data', 'info');
  };

  // Download CSV file
  const handleDownloadCsv = () => {
    triggerHaptic('light');
    const csvString = Papa.unparse(data.map((item) => ({ Label: item.name, Value: item.value })));
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(title || 'chart-data').toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    onNotify?.('Downloaded data as CSV!', 'success');
  };

  // CSV File upload via PapaParse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length === 0) return;
        const parsed: DataItem[] = [];
        let startIndex = 0;
        // Check if first row is header
        const firstVal = parseFloat(rows[0][1]?.replace(/[^0-9.-]/g, ''));
        if (isNaN(firstVal) && rows.length > 1) {
          startIndex = 1;
        }
        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 2) {
            const name = String(row[0]).trim();
            const val = parseFloat(String(row[1]).replace(/[^0-9.-]/g, ''));
            if (name && !isNaN(val)) {
              parsed.push({
                id: `csv_file_${i}_${Math.random().toString(36).substring(2, 6)}`,
                name,
                value: val
              });
            }
          }
        }
        if (parsed.length > 0) {
          onChangeData(parsed);
          triggerHaptic('success');
          onNotify?.(`Imported ${parsed.length} rows from CSV file!`, 'success');
        }
      }
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApplyCsvText = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const parsed: DataItem[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split(/[,\t]/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const rawVal = parts[1].replace(/[^0-9.-]/g, '');
        const val = parseFloat(rawVal);
        if (name && !isNaN(val)) {
          parsed.push({ id: `csv_${idx}`, name, value: val });
        }
      }
    });
    if (parsed.length > 0) {
      onChangeData(parsed);
      setShowCsvBox(false);
      setCsvText('');
      triggerHaptic('success');
      onNotify?.(`Pasted ${parsed.length} rows!`, 'success');
    }
  };

  return (
    <div className="control-panel-card">
      {/* Top Segmented Pill Toggle: Content vs Style vs Settings */}
      <div className="segmented-tab-track">
        <button
          className={`segmented-tab-pill ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            onChangeTab('content');
          }}
        >
          Content
        </button>
        <button
          className={`segmented-tab-pill ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            onChangeTab('style');
          }}
        >
          Style
        </button>
        <button
          className={`segmented-tab-pill ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            onChangeTab('settings');
          }}
        >
          Settings
        </button>
      </div>

      {/* Tab 2: STYLE (Colors, Canvas Mode, Typography, Depth & Grid) */}
      {activeTab === 'style' && (
        <div className="panel-tab-body animate-fade">
          {/* Color theme Section */}
          <div className="control-section">
            <h3 className="section-title">Color theme</h3>
            <div className="swatch-row">
              {PRESET_SWATCHES.map((swatch) => {
                const isSelected = activeScheme.id === swatch.schemeId;
                return (
                  <button
                    key={swatch.id}
                    title={swatch.name}
                    className={`theme-circle-swatch ${isSelected ? 'selected' : ''}`}
                    style={{ background: swatch.bgStyle }}
                    onClick={() => {
                      triggerHaptic('light');
                      const found = COLOR_SCHEMES.find(s => s.id === swatch.schemeId);
                      if (found) onSelectScheme(found);
                    }}
                  >
                    {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {/* All 12 Pro Themes Selector */}
            <div style={{ marginTop: '10px' }}>
              <div className="select-wrapper">
                <select
                  value={activeScheme.id}
                  onChange={(e) => {
                    const match = COLOR_SCHEMES.find(s => s.id === e.target.value);
                    if (match) onSelectScheme(match);
                  }}
                  className="clean-select"
                  style={{ fontSize: '0.8rem', padding: '6px 28px 6px 10px' }}
                >
                  {COLOR_SCHEMES.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.name} ({scheme.colors.length} swatches)
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="select-chevron" />
              </div>
            </div>
          </div>

          {/* Canvas Mode */}
          <div className="control-section">
            <h3 className="section-title">Canvas mode</h3>
            <div className="pill-group" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`pill-btn ${bgMode === 'light' ? 'active' : ''}`}
                onClick={() => onChangeBgMode('light')}
              >
                Light
              </button>
              <button
                type="button"
                className={`pill-btn ${bgMode === 'dark' ? 'active' : ''}`}
                onClick={() => onChangeBgMode('dark')}
              >
                Dark
              </button>
              <button
                type="button"
                className={`pill-btn ${bgMode === 'spotify' ? 'active' : ''}`}
                onClick={() => onChangeBgMode('spotify')}
              >
                Wrapped
              </button>
              <button
                type="button"
                className={`pill-btn ${bgMode === 'paper' ? 'active' : ''}`}
                onClick={() => onChangeBgMode('paper')}
              >
                Paper
              </button>
              <button
                type="button"
                className={`pill-btn ${bgMode === 'pure-dark' ? 'active' : ''}`}
                onClick={() => onChangeBgMode('pure-dark')}
              >
                OLED
              </button>
              <button
                type="button"
                className={`pill-btn ${bgMode === 'slate' ? 'active' : ''}`}
                onClick={() => onChangeBgMode('slate')}
              >
                Slate
              </button>
            </div>
          </div>

          {/* Font Section */}
          <div className="control-section">
            <h3 className="section-title">Font</h3>
            
            {/* Typeface */}
            <div className="control-field">
              <label className="field-label">Typeface</label>
              <div className="select-wrapper">
                <select
                  value={fontFamily}
                  onChange={(e) => onChangeFontFamily(e.target.value as FontFamily)}
                  className="clean-select"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Display</option>
                  <option value="Inter">Inter</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Outfit">Outfit</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                </select>
                <ChevronDown size={15} className="select-chevron" />
              </div>
            </div>

            {/* Font Size */}
            <div className="control-field" style={{ marginTop: '12px' }}>
              <label className="field-label">Font Size</label>
              <div className="select-wrapper">
                <select
                  value={fontSize}
                  onChange={(e) => onChangeFontSize(e.target.value as 'small' | 'medium' | 'large')}
                  className="clean-select"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                <ChevronDown size={15} className="select-chevron" />
              </div>
            </div>
          </div>

          {/* Visual Depth & Grid */}
          <div className="control-section">
            <h3 className="section-title">Visual Depth & Grid</h3>

            {/* 3D Depth Toggle */}
            <div className="toggle-row">
              <span className="toggle-label">3D depth & specular shine</span>
              <label className="clean-toggle-switch">
                <input
                  type="checkbox"
                  checked={is3d}
                  onChange={onToggle3d}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Grid lines Toggle */}
            <div className="toggle-row" style={{ marginTop: '12px' }}>
              <span className="toggle-label">Cartesian grid lines</span>
              <label className="clean-toggle-switch">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={onToggleGrid}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SETTINGS (Aspect Ratio, Display Elements, Branding) */}
      {activeTab === 'settings' && (
        <div className="panel-tab-body animate-fade">
          {/* Social Canvas Aspect Ratio */}
          <div className="control-section">
            <h3 className="section-title">Canvas Aspect Ratio</h3>
            <div className="aspect-card-grid">
              {ASPECT_CARDS.map((card) => {
                const isSelected = aspectRatio === card.ratio;
                return (
                  <button
                    key={card.ratio}
                    type="button"
                    className={`aspect-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      onChangeAspectRatio(card.ratio);
                    }}
                  >
                    <div className="aspect-card-header">
                      <div
                        className="aspect-preview-box"
                        style={{ width: `${card.boxW}px`, height: `${card.boxH}px` }}
                      />
                      {isSelected && <Check size={14} className="aspect-check-icon" />}
                    </div>
                    <div className="aspect-card-title">{card.name}</div>
                    <div className="aspect-card-tag">{card.tag}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Elements */}
          <div className="control-section">
            <h3 className="section-title">Display elements</h3>

            {/* Show labels Toggle */}
            <div className="toggle-row">
              <span className="toggle-label">Show value labels</span>
              <label className="clean-toggle-switch">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={onToggleLabels}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Show legend Toggle */}
            <div className="toggle-row" style={{ marginTop: '12px' }}>
              <span className="toggle-label">Show legend</span>
              <label className="clean-toggle-switch">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={onToggleLegend}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Watermark Toggle */}
            <div className="toggle-row" style={{ marginTop: '12px' }}>
              <span className="toggle-label">ChartGenie badge</span>
              <label className="clean-toggle-switch">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={onToggleWatermark}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Viral Branding & Key Insight */}
          <div className="control-section">
            <h3 className="section-title">Branding & Takeaway</h3>
            
            <div className="control-field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AtSign size={12} /> Creator Handle Watermark
              </label>
              <input
                type="text"
                value={creatorHandle}
                onChange={(e) => onChangeCreatorHandle?.(e.target.value)}
                placeholder="e.g. @yourname"
                className="clean-input"
                style={{ fontSize: '0.84rem' }}
              />
            </div>

            <div className="control-field" style={{ marginTop: '10px' }}>
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} color="#f59e0b" /> Key Insight / Callout Banner
              </label>
              <input
                type="text"
                value={calloutMetric}
                onChange={(e) => onChangeCalloutMetric?.(e.target.value)}
                placeholder="e.g. 💡 38% Time Thinking vs 12% Coding"
                className="clean-input"
                style={{ fontSize: '0.84rem' }}
              />
            </div>
          </div>

          {/* SEO & Search Console Card */}
          <div className="control-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="#3b82f6" />
                <h3 className="section-title" style={{ margin: 0, fontSize: '0.82rem' }}>SEO & Search Console</h3>
              </div>
              <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                Indexed & Live
              </span>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '8px', lineHeight: 1.4 }}>
              Production domain: <strong style={{ color: '#0f172a' }}>chartgenie.xyz</strong> (Vercel Edge SSL)
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                type="text"
                value={gscTag}
                onChange={(e) => setGscTag(e.target.value)}
                placeholder="GSC verification tag"
                className="clean-input"
                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                title="Google Search Console verification token"
              />
              <button
                type="button"
                onClick={handleSaveGscTag}
                className="btn-apply-csv"
                style={{ padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCopyGscMeta}
                className="quick-tool-btn"
                style={{ padding: '4px 8px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                title="Copy <meta> tag for Google Search Console"
              >
                <Copy size={12} /> Meta
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
              <a
                href="https://chartgenie.xyz/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.72rem', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <CheckCircle2 size={12} color="#10b981" /> sitemap.xml
              </a>
              <a
                href="https://chartgenie.xyz/llms.txt"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.72rem', color: '#8b5cf6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Sparkles size={12} color="#8b5cf6" /> llms.txt (GEO)
              </a>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.72rem', color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                Open GSC <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Google Analytics 4 (GA4) Telemetry Card */}
          <div className="control-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#10b981" />
                <h3 className="section-title" style={{ margin: 0, fontSize: '0.82rem' }}>Google Analytics 4</h3>
              </div>
              <span style={{ fontSize: '0.68rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                {gaId ? 'Active' : 'Ready'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                placeholder="G-XXXXXXXXXX (Measurement ID)"
                className="clean-input"
                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
              />
              <button
                type="button"
                onClick={handleSaveGaId}
                className="btn-apply-csv"
                style={{ padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
              >
                Apply
              </button>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
              Auto-dispatches pageviews, chart creations, aspect ratios & exports.
            </div>
          </div>

          {/* Self-Learning Growth & Feedback Loop Card */}
          <div className="control-section" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#f59e0b" />
                <h3 className="section-title" style={{ margin: 0, fontSize: '0.82rem' }}>Self-Learning Growth Loop</h3>
              </div>
              <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                Learning Engine
              </span>
            </div>

            {/* Quick stats snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Charts Created</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{stats.chartsCreatedCount + 1}</div>
              </div>
              <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Exports Logged</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{stats.exportsCount}</div>
              </div>
            </div>

            {/* 1-Click Viral Share Link */}
            <button
              type="button"
              className="quick-tool-btn"
              onClick={handleCopyShareLink}
              style={{ width: '100%', justifyContent: 'center', marginBottom: '10px', padding: '6px' }}
            >
              <Share2 size={13} color="#6366f1" /> Copy Studio Viral Link (UTM)
            </button>

            {/* 1-Click CSAT Feedback Widget */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 500 }}>
                {feedbackSent ? 'Feedback logged! ✨' : 'Is ChartGenie helpful?'}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleFeedback('positive')}
                  className="quick-tool-btn"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  title="Yes, love it!"
                >
                  <ThumbsUp size={12} color="#10b981" /> Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback('negative')}
                  className="quick-tool-btn"
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  title="Needs improvement"
                >
                  <ThumbsDown size={12} color="#ef4444" /> Needs work
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CONTENT (Intuitive live data editing) */}
      {activeTab === 'content' && (
        <div className="panel-tab-body animate-fade">
          {/* Title & Subtitle */}
          <div className="control-section">
            <h3 className="section-title">Chart Title</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder="e.g. Countries"
              className="clean-input"
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => onChangeSubtitle(e.target.value)}
              placeholder="Subtitle (optional)"
              className="clean-input"
              style={{ marginTop: '8px', fontSize: '0.84rem' }}
            />
          </div>

          {/* Quick Viral & Data Tools Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              className="quick-tool-btn"
              onClick={onOpenAiPrompt}
              title="Generate with AI prompt"
            >
              <Wand2 size={13} color="#6366f1" /> AI Prompt
            </button>
            <button
              type="button"
              className="quick-tool-btn"
              onClick={onAutoEmoji}
              title="Add viral auto-emojis to labels"
            >
              <Sparkles size={13} color="#f59e0b" /> Auto Emoji
            </button>
            <button
              type="button"
              className="quick-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload CSV or TSV file"
            >
              <Upload size={13} color="#10b981" /> Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            <button
              type="button"
              className="quick-tool-btn"
              onClick={() => setShowCsvBox(!showCsvBox)}
              title="Quick paste text CSV"
            >
              <FileSpreadsheet size={13} color="#06b6d4" /> Paste Text
            </button>
            <button
              type="button"
              className="quick-tool-btn"
              onClick={handleSortToggle}
              title="Sort items"
            >
              <ArrowUpDown size={13} color="#8b5cf6" /> {sortAsc ? 'Asc' : 'Desc'}
            </button>
            <button
              type="button"
              className="quick-tool-btn"
              onClick={handleShuffle}
              title="Randomize test numbers"
            >
              <Shuffle size={13} color="#ec4899" /> Mock
            </button>
          </div>

          {showCsvBox && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Paste CSV / TSV (Label, Value):
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="USA, 50&#10;Italy, 16&#10;UK, 15&#10;Ireland, 19"
                rows={4}
                className="clean-input"
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setShowCsvBox(false)}
                  style={{ fontSize: '0.78rem', padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-apply-csv"
                  onClick={handleApplyCsvText}
                >
                  Apply Data
                </button>
              </div>
            </div>
          )}

          {/* Data Points List */}
          <div className="control-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 className="section-title" style={{ margin: 0 }}>Data points</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Total: <b>{typeof total === 'number' ? total.toLocaleString() : total}</b> (avg: {avg})
                </span>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  title="Download data as CSV"
                  style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                >
                  <Download size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleResetSample}
                  title="Reset to sample"
                  style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            <div className="data-rows-container">
              {data.map((item, idx) => (
                <div key={item.id} className="data-row-item">
                  {/* Inline Color Swatch Picker */}
                  <label
                    title="Change slice / bar color"
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: item.color || activeScheme.colors[idx % activeScheme.colors.length],
                      flexShrink: 0,
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'inline-block',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    <input
                      type="color"
                      value={item.color || activeScheme.colors[idx % activeScheme.colors.length]}
                      onChange={(e) => handleUpdateItem(item.id, 'color', e.target.value)}
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    />
                  </label>

                  {/* Name Input */}
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                    placeholder="Label"
                    className="data-input-name"
                  />

                  {/* Value Input */}
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleUpdateItem(item.id, 'value', parseFloat(e.target.value) || 0)}
                    placeholder="Value"
                    className="data-input-val"
                  />

                  {/* Reorder Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveRow(idx, 'up')}
                    className="data-delete-btn"
                    title="Move up"
                    disabled={idx === 0}
                  >
                    <ChevronUp size={13} />
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveRow(idx, 'down')}
                    className="data-delete-btn"
                    title="Move down"
                    disabled={idx === data.length - 1}
                  >
                    <ChevronDown size={13} />
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateRow(item.id)}
                    className="data-delete-btn"
                    title="Duplicate row"
                  >
                    <Copy size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="data-delete-btn"
                    title="Remove item"
                    disabled={data.length <= 1}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <button
              type="button"
              className="btn-add-row"
              onClick={handleAddItem}
            >
              <Plus size={15} /> Add Point
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
