import React from 'react';
import { COLOR_SCHEMES } from '../lib/chartPresets';
import type { ChartType, ColorScheme, AspectRatio, FontFamily } from '../lib/chartPresets';
import { PieChart, BarChart2, TrendingUp, Layers, Sliders, Layout, Type, Palette } from 'lucide-react';

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
  bgMode: 'dark' | 'pure-dark' | 'slate' | 'light';
  onChangeBgMode: (mode: 'dark' | 'pure-dark' | 'slate' | 'light') => void;
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
  onChangeBgMode
}) => {
  const chartTypesList: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'pie', label: 'Pie Chart', icon: <PieChart size={15} /> },
    { type: 'donut', label: 'Donut', icon: <PieChart size={15} /> },
    { type: 'bar', label: 'Bar Graph', icon: <BarChart2 size={15} /> },
    { type: 'horizontalBar', label: 'H-Bar', icon: <BarChart2 size={15} style={{ transform: 'rotate(90deg)' }} /> },
    { type: 'line', label: 'Line Chart', icon: <TrendingUp size={15} /> },
    { type: 'area', label: 'Area Chart', icon: <Layers size={15} /> },
    { type: 'radar', label: 'Radar Matrix', icon: <Sliders size={15} /> }
  ];

  const aspectRatios: AspectRatio[] = ['16:9', '1:1', '9:16', '4:3'];
  const fonts: FontFamily[] = ['Plus Jakarta Sans', 'Inter', 'JetBrains Mono', 'Outfit', 'Playfair Display'];

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sliders size={18} color="#a5b4fc" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Pro Customizer & Theme Engine
        </h3>
      </div>

      {/* Chart Types Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Chart Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
          {chartTypesList.map((item) => (
            <button
              key={item.type}
              onClick={() => onChangeChartType(item.type)}
              className={`btn-secondary ${chartType === item.type ? 'active' : ''}`}
              style={{
                padding: '7px 8px',
                fontSize: '0.75rem',
                justifyContent: 'center',
                background: chartType === item.type ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: chartType === item.type ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-glass)',
                color: chartType === item.type ? '#a5b4fc' : 'var(--text-main)'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio & Typography Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
        {/* Aspect Ratio */}
        <div>
          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layout size={12} /> Canvas Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => onChangeAspectRatio(e.target.value as AspectRatio)}
            className="input-glass"
            style={{ marginTop: '6px', fontSize: '0.8rem', padding: '6px 8px' }}
          >
            {aspectRatios.map((r) => (
              <option key={r} value={r} style={{ background: '#0f172a' }}>{r} {r === '9:16' ? '(Story/Reels)' : r === '1:1' ? '(Square)' : ''}</option>
            ))}
          </select>
        </div>

        {/* Typography */}
        <div>
          <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Type size={12} /> Font Family
          </label>
          <select
            value={fontFamily}
            onChange={(e) => onChangeFontFamily(e.target.value as FontFamily)}
            className="input-glass"
            style={{ marginTop: '6px', fontSize: '0.8rem', padding: '6px 8px' }}
          >
            {fonts.map((f) => (
              <option key={f} value={f} style={{ background: '#0f172a' }}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Background Theme Selector */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Palette size={12} /> Canvas Theme
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
          <button
            onClick={() => onChangeBgMode('dark')}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'dark' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Glass Dark
          </button>
          <button
            onClick={() => onChangeBgMode('pure-dark')}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'pure-dark' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Pure Black
          </button>
          <button
            onClick={() => onChangeBgMode('slate')}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'slate' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)' }}
          >
            Slate
          </button>
          <button
            onClick={() => onChangeBgMode('light')}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '0.72rem', justifyContent: 'center', background: bgMode === 'light' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)', color: bgMode === 'light' ? '#ffffff' : 'var(--text-main)' }}
          >
            Clean Light
          </button>
        </div>
      </div>

      {/* Color Palettes Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Color Palette Preset
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => onChangeScheme(scheme)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                background: activeScheme.id === scheme.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeScheme.id === scheme.id ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-glass)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {scheme.name}
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {scheme.colors.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: '12px',
                      height: '12px',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', cursor: 'pointer' }}>
          <span>Show Legend</span>
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => onToggleLegend(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', cursor: 'pointer' }}>
          <span>Show Percentage / Values</span>
          <input
            type="checkbox"
            checked={showValues}
            onChange={(e) => onToggleValues(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', cursor: 'pointer' }}>
          <span>3D Elevation Effect</span>
          <input
            type="checkbox"
            checked={is3d}
            onChange={(e) => onToggle3d(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>
      </div>
    </div>
  );
};
