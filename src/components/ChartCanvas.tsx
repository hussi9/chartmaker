import React from 'react';
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart as ReLineChart,
  Line,
  AreaChart as ReAreaChart,
  Area,
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart as ReScatterChart,
  Scatter
} from 'recharts';
import type { DataItem, ChartType, ColorScheme, AspectRatio, FontFamily } from '../lib/chartPresets';

interface ChartCanvasProps {
  data: DataItem[];
  chartType: ChartType;
  scheme: ColorScheme;
  title: string;
  subtitle: string;
  showLegend: boolean;
  showValues: boolean;
  is3d: boolean;
  aspectRatio: AspectRatio;
  fontFamily: FontFamily;
  bgMode: 'dark' | 'pure-dark' | 'slate' | 'light';
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        color: '#ffffff'
      }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>{item.name || item.payload?.name}</p>
        <p style={{ margin: '4px 0 0', color: '#38bdf8', fontWeight: 600, fontSize: '0.85rem' }}>
          Value: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
        </p>
      </div>
    );
  }
  return null;
};

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  data,
  chartType,
  scheme,
  title,
  subtitle,
  showLegend,
  showValues,
  is3d,
  aspectRatio,
  fontFamily,
  bgMode,
  canvasRef
}) => {
  const colors = scheme.colors;
  const total = data.reduce((acc, curr) => acc + (typeof curr.value === 'number' ? curr.value : 0), 0);

  // Background style helper
  const getBgStyle = () => {
    switch (bgMode) {
      case 'pure-dark':
        return { bg: '#000000', text: '#ffffff', border: 'rgba(255,255,255,0.1)' };
      case 'slate':
        return { bg: '#0f172a', text: '#f8fafc', border: 'rgba(255,255,255,0.1)' };
      case 'light':
        return { bg: '#ffffff', text: '#0f172a', border: 'rgba(0,0,0,0.1)' };
      default:
        return { bg: 'rgba(11, 15, 25, 0.95)', text: '#f8fafc', border: 'rgba(255,255,255,0.08)' };
    }
  };

  const bgConfig = getBgStyle();

  // Height calculations based on aspect ratio
  const getAspectHeight = () => {
    switch (aspectRatio) {
      case '1:1':
        return 440;
      case '9:16':
        return 520;
      case '4:3':
        return 420;
      default: // 16:9
        return 380;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
      {/* Target Canvas Div for High-DPI Exporting */}
      <div
        ref={canvasRef}
        id="chart-render-target"
        style={{
          background: bgConfig.bg,
          color: bgConfig.text,
          padding: '28px',
          borderRadius: '16px',
          border: `1px solid ${bgConfig.border}`,
          boxShadow: is3d ? '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
          fontFamily: fontFamily,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: bgConfig.text }}>
            {title || 'Untitled Chart'}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.85rem', color: bgMode === 'light' ? '#64748b' : '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Chart Render Area */}
        <div style={{ width: '100%', height: getAspectHeight(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              switch (chartType) {
                case 'pie':
                case 'donut':
                  return (
                    <RePieChart>
                      <Tooltip content={<CustomTooltip />} />
                      {showLegend && <Legend verticalAlign="bottom" height={36} />}
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={chartType === 'donut' ? 75 : 0}
                        outerRadius={125}
                        paddingAngle={chartType === 'donut' ? 4 : 2}
                        dataKey="value"
                        label={showValues ? ({ name, percent }: { name?: string; percent?: number }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%` : false}
                        labelLine={showValues}
                      >
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || colors[index % colors.length]}
                            stroke={bgConfig.bg}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </RePieChart>
                  );

                case 'bar':
                  return (
                    <ReBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <YAxis stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      {showLegend && <Legend verticalAlign="bottom" height={36} />}
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </ReBarChart>
                  );

                case 'horizontalBar':
                  return (
                    <ReBarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                      <XAxis type="number" stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      {showLegend && <Legend verticalAlign="bottom" height={36} />}
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </ReBarChart>
                  );

                case 'line':
                  return (
                    <ReLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <YAxis stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      {showLegend && <Legend verticalAlign="bottom" height={36} />}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={colors[0]}
                        strokeWidth={3}
                        dot={{ r: 6, fill: colors[0], strokeWidth: 2, stroke: bgConfig.bg }}
                        activeDot={{ r: 8 }}
                      />
                    </ReLineChart>
                  );

                case 'area':
                  return (
                    <ReAreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="areaColorPro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors[0]} stopOpacity={0.7} />
                          <stop offset="95%" stopColor={colors[0]} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <YAxis stroke={bgMode === 'light' ? '#94a3b8' : '#64748b'} tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      {showLegend && <Legend verticalAlign="bottom" height={36} />}
                      <Area type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={3} fillOpacity={1} fill="url(#areaColorPro)" />
                    </ReAreaChart>
                  );

                case 'radar':
                  return (
                    <ReRadarChart cx="50%" cy="50%" outerRadius={110} data={data}>
                      <PolarGrid stroke={bgMode === 'light' ? '#cbd5e1' : '#334155'} />
                      <PolarAngleAxis dataKey="name" tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <PolarRadiusAxis stroke="#64748b" />
                      <Radar name="Value" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
                      <Tooltip content={<CustomTooltip />} />
                    </ReRadarChart>
                  );

                case 'scatter':
                  return (
                    <ReScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <YAxis dataKey="value" stroke="#64748b" tick={{ fill: bgConfig.text, fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Scatter data={data} fill={colors[0]} />
                    </ReScatterChart>
                  );

                default:
                  return null;
              }
            })()}
          </ResponsiveContainer>
        </div>

        {/* Branding Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${bgMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
          fontSize: '0.75rem',
          color: bgMode === 'light' ? '#64748b' : '#94a3b8'
        }}>
          <span style={{ fontWeight: 600 }}>Generated with ChartGenie.xyz</span>
          <span>Total: {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
