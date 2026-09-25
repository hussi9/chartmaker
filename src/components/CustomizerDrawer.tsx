import React from 'react';
import { COLOR_SCHEMES } from '../lib/chartPresets';
import type { ChartType, ColorScheme, AspectRatio, FontFamily, CanvasThemeMode } from '../lib/chartPresets';
import { PieChart, BarChart2, TrendingUp, Layers, Sliders, Layout, Type, Palette, AtSign } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

interface CustomizerDrawerProps {
  chartType: ChartType;
  onChangeChartType: (type: ChartType) => void;
  activeScheme: ColorScheme;
  onChangeScheme: (scheme: ColorScheme) => void;
  showLegend: boolean;
  onToggleLegend: (val: boolean) => void;
  showValues: boolean;
  onToggleValues: (val: boolean) => void;
  is3d: boolean;
  onToggle3d: (val: boolean) => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  fontFamily: FontFamily;
  onChangeFontFamily: (font: FontFamily) => void;
  bgMode: CanvasThemeMode;
  onChangeBgMode: (mode: CanvasThemeMode) => void;
  creatorHandle?: string;
  onChangeCreatorHandle?: (handle: string) => void;
  calloutMetric?: string;
  onChangeCalloutMetric?: (metric: string) => void;
  showWatermark?: boolean;
  onToggleWatermark?: (val: boolean) => void;
}

export const CustomizerDrawer: React.FC<CustomizerDrawerProps> = ({
  chartType,
  onChangeChartType,
  activeScheme,
  onChangeScheme,
  showLegend,
  onToggleLegend,
  showValues,
  onToggleValues,
  is3d,
  onToggle3d,
  aspectRatio,
  onChangeAspectRatio,
  fontFamily,
  onChangeFontFamily,
  bgMode,
  onChangeBgMode,
  creatorHandle = '',
  onChangeCreatorHandle,
  calloutMetric = '',
  onChangeCalloutMetric,
  showWatermark = true,
  onToggleWatermark
}) => {
  const chartTypesList: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'pie', label: 'Pie Chart', icon: <PieChart size={15} /> },
    { type: 'donut', label: 'Donut', icon: <PieChart size={15} /> },
    { type: 'stackedBar', label: 'Stacked Strip', icon: <Layers size={15} /> },
    { type: 'bar', label: 'Bar Graph', icon: <BarChart2 size={15} /> },
    { type: 'horizontalBar', label: 'H-Bar', icon: <BarChart2 size={15} style={{ transform: 'rotate(90deg)' }} /> },
    { type: 'line', label: 'Line Chart', icon: <TrendingUp size={15} /> },
    { type: 'area', label: 'Area Chart', icon: <Layers size={15} /> },
    { type: 'radar', label: 'Radar Matrix', icon: <Sliders size={15} /> }
  ];

  const aspectRatios: { ratio: AspectRatio; label: string; tag: string }[] = [
    { ratio: '16:9', label: '16:9', tag: 'X / YouTube' },
    { ratio: '1:1', label: '1:1', tag: 'IG / LinkedIn' },
    { ratio: '9:16', label: '9:16', tag: 'TikTok / Story' },
    { ratio: '4:3', label: '4:3', tag: 'Slide Deck' }
  ];

  const fonts: FontFamily[] = ['Plus Jakarta Sans', 'Inter', 'JetBrains Mono', 'Outfit', 'Playfair Display'];

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sliders size={18} color="#a5b4fc" />
        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Theme & Design Studio
        </h3>
      </div>

      {/* Chart Types Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Chart Format
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
          {chartTypesList.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                triggerHaptic('light');
                onChangeChartType(item.type);
              }}
              className={`btn-secondary ${chartType === item.type ? 'active' : ''}`}
              style={{
                padding: '7px 6px',
                fontSize: '0.74rem',
                justifyContent: 'center',
                background: chartType === item.type ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: chartType === item.type ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-glass)',
                color: chartType === item.type ? '#a5b4fc' : 'var(--text-main)'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Social Aspect Ratio Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layout size={13} /> Social Aspect Ratio
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '6px' }}>
          {aspectRatios.map((item) => (
            <button
              key={item.ratio}
              onClick={() => {
                triggerHaptic('light');
                onChangeAspectRatio(item.ratio);
              }}
              className="btn-secondary"
              style={{
                padding: '6px 10px',
                fontSize: '0.76rem',
                justifyContent: 'space-between',
                background: aspectRatio === item.ratio ? 'rgba(99, 102, 241, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: aspectRatio === item.ratio ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-glass)',
                color: aspectRatio === item.ratio ? '#a5b4fc' : 'var(--text-main)'
              }}
            >
              <span style={{ fontWeight: 700 }}>{item.label}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Viral Canvas Themes */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Palette size={13} /> Viral Canvas Theme
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
          <button
            onClick={() => { triggerHaptic('light'); onChangeBgMode('dark'); }}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'dark' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Glass Dark
          </button>
          <button
            onClick={() => { triggerHaptic('light'); onChangeBgMode('spotify'); }}
            className="btn-secondary"
            style={{
              padding: '6px',
              fontSize: '0.72rem',
              justifyContent: 'center',
              background: bgMode === 'spotify' ? 'rgba(30,215,96,0.3)' : 'rgba(255,255,255,0.04)',
              color: bgMode === 'spotify' ? '#1ed760' : 'var(--text-main)',
              borderColor: bgMode === 'spotify' ? 'rgba(30,215,96,0.5)' : 'var(--border-glass)'
            }}
          >
            Wrapped
          </button>
          <button
            onClick={() => { triggerHaptic('light'); onChangeBgMode('pure-dark'); }}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'pure-dark' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Pure OLED
          </button>
          <button
            onClick={() => { triggerHaptic('light'); onChangeBgMode('slate'); }}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'slate' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Slate Tech
          </button>
          <button
            onClick={() => { triggerHaptic('light'); onChangeBgMode('paper'); }}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'paper' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Notion Paper
          </button>
          <button
            onClick={() => { triggerHaptic('light'); onChangeBgMode('light'); }}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'light' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Studio Light
          </button>
        </div>
      </div>

      {/* Typography & Creator Watermark Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
        <div>
          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Type size={12} /> Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => {
              triggerHaptic('light');
              onChangeFontFamily(e.target.value as FontFamily);
            }}
            className="input-glass"
            style={{ marginTop: '6px', fontSize: '0.78rem', padding: '6px 8px' }}
          >
            {fonts.map((f) => (
              <option key={f} value={f} style={{ background: '#0f172a' }}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AtSign size={12} /> Creator Handle
          </label>
          <input
            type="text"
            value={creatorHandle}
            onChange={(e) => onChangeCreatorHandle?.(e.target.value)}
            placeholder="@yourhandle"
            className="input-glass"
            style={{ marginTop: '6px', fontSize: '0.78rem', padding: '6px 8px' }}
          />
        </div>
      </div>

      {/* Callout Metric / Key Insight */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⚡ Key Insight / Takeaway Banner (Optional)
        </label>
        <input
          type="text"
          value={calloutMetric}
          onChange={(e) => onChangeCalloutMetric?.(e.target.value)}
          placeholder="e.g. 71.4% Market Share Dominance or +45% YoY Growth"
          className="input-glass"
          style={{ marginTop: '6px', fontSize: '0.8rem', padding: '6px 10px' }}
        />
      </div>

      {/* Color Palettes Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Color Palette Preset
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => {
                triggerHaptic('light');
                onChangeScheme(scheme);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: activeScheme.id === scheme.id ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeScheme.id === scheme.id ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-glass)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {scheme.name}
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {scheme.colors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: '11px',
                      height: '11px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      display: 'inline-block'
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', cursor: 'pointer' }}>
          <span>Show Legend</span>
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => onToggleLegend(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', cursor: 'pointer' }}>
          <span>Show Values / %</span>
          <input
            type="checkbox"
            checked={showValues}
            onChange={(e) => onToggleValues(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', cursor: 'pointer' }}>
          <span>3D Glow & Elevation</span>
          <input
            type="checkbox"
            checked={is3d}
            onChange={(e) => onToggle3d(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', cursor: 'pointer' }}>
          <span>Show Branding Watermark</span>
          <input
            type="checkbox"
            checked={showWatermark}
            onChange={(e) => onToggleWatermark?.(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>
      </div>
    </div>
  );
};
