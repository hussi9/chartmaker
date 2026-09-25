import { COLOR_SCHEMES } from '../lib/chartPresets';
import type { ChartType, ColorScheme } from '../lib/chartPresets';
import { PieChart, BarChart2, TrendingUp, Layers, Sliders } from 'lucide-react';

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
  onToggle3d
}) => {
  const chartTypesList: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'pie', label: 'Pie Chart', icon: <PieChart size={16} /> },
    { type: 'donut', label: 'Donut', icon: <PieChart size={16} /> },
    { type: 'bar', label: 'Bar Graph', icon: <BarChart2 size={16} /> },
    { type: 'horizontalBar', label: 'Horizontal Bar', icon: <BarChart2 size={16} style={{ transform: 'rotate(90deg)' }} /> },
    { type: 'line', label: 'Line Chart', icon: <TrendingUp size={16} /> },
    { type: 'area', label: 'Area Chart', icon: <Layers size={16} /> }
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sliders size={18} color="#a5b4fc" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Visual Styling & Controls
        </h3>
      </div>

      {/* Chart Types Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Chart Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
          {chartTypesList.map((item) => (
            <button
              key={item.type}
              onClick={() => onChangeChartType(item.type)}
              className={`btn-secondary ${chartType === item.type ? 'active' : ''}`}
              style={{
                padding: '8px 10px',
                fontSize: '0.78rem',
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

      {/* Color Palettes Picker */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Color Palette Preset
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => onChangeScheme(scheme)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: activeScheme.id === scheme.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeScheme.id === scheme.id ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-glass)'}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {scheme.name}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {scheme.colors.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: '14px',
                      height: '14px',
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
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', cursor: 'pointer' }}>
          <span>Show Legend</span>
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(e) => onToggleLegend(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', cursor: 'pointer' }}>
          <span>Show Values / Labels</span>
          <input
            type="checkbox"
            checked={showValues}
            onChange={(e) => onToggleValues(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-glow)', cursor: 'pointer' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', cursor: 'pointer' }}>
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
