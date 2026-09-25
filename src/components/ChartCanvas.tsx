import React, { useState } from 'react';
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
  CartesianGrid,
  LabelList,
  AreaChart as ReAreaChart,
  Area,
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart as ReScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';
import type { DataItem, ChartType, ColorScheme, AspectRatio, FontFamily, CanvasThemeMode } from '../lib/chartPresets';
import { Maximize2, Minimize2, Copy, Sparkles, Check, Link2, Download, Table } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

interface ChartCanvasProps {
  data: DataItem[];
  chartType: ChartType;
  scheme: ColorScheme;
  title: string;
  subtitle: string;
  calloutMetric?: string;
  dataSource?: string;
  showLegend: boolean;
  showValues: boolean;
  showAverageLine?: boolean;
  is3d: boolean;
  aspectRatio: AspectRatio;
  onChangeAspectRatio?: (ratio: AspectRatio) => void;
  fontFamily: FontFamily;
  bgMode: CanvasThemeMode;
  creatorHandle?: string;
  showWatermark?: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onCopyImage?: () => void;
  fontSize?: 'small' | 'medium' | 'large';
  showGrid?: boolean;
  onGetShareLink?: () => void;
  onDownload?: () => void;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255,255,255,0.18)',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        color: '#ffffff',
        backdropFilter: 'blur(8px)'
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
  calloutMetric = '',
  dataSource = '',
  showLegend,
  showValues,
  showAverageLine = false,
  is3d,
  aspectRatio,
  onChangeAspectRatio,
  fontFamily,
  bgMode,
  creatorHandle = '',
  showWatermark = true,
  canvasRef,
  onCopyImage,
  fontSize = 'medium',
  showGrid = true,
  onGetShareLink,
  onDownload
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [justCopiedReddit, setJustCopiedReddit] = useState(false);

  const colors = scheme.colors;
  const total = data.reduce((acc, curr) => acc + (typeof curr.value === 'number' ? curr.value : 0), 0);

  // Background & Theme styling
  const getBgStyle = () => {
    switch (bgMode) {
      case 'pure-dark':
        return {
          bg: '#000000',
          text: '#ffffff',
          subtext: '#94a3b8',
          border: 'rgba(255,255,255,0.12)',
          glow: is3d ? '0 20px 50px rgba(0,0,0,0.8)' : 'none',
          pillBg: 'rgba(255,255,255,0.1)'
        };
      case 'spotify':
        return {
          bg: '#121212',
          text: '#ffffff',
          subtext: '#a7a7a7',
          border: '1px solid rgba(30, 215, 96, 0.3)',
          glow: is3d ? '0 20px 60px rgba(30, 215, 96, 0.15), 0 0 30px rgba(0,0,0,0.9)' : 'none',
          pillBg: 'rgba(30, 215, 96, 0.15)'
        };
      case 'paper':
        return {
          bg: '#fcfcf9',
          text: '#2f3437',
          subtext: '#64748b',
          border: 'rgba(0,0,0,0.12)',
          glow: is3d ? '0 12px 36px rgba(0,0,0,0.06)' : 'none',
          pillBg: 'rgba(0,0,0,0.06)'
        };
      case 'light':
        return {
          bg: '#ffffff',
          text: '#0f172a',
          subtext: '#64748b',
          border: 'rgba(0,0,0,0.1)',
          glow: is3d ? '0 16px 40px rgba(0,0,0,0.08)' : 'none',
          pillBg: 'rgba(0,0,0,0.05)'
        };
      case 'slate':
        return {
          bg: '#0f172a',
          text: '#f8fafc',
          subtext: '#94a3b8',
          border: 'rgba(255,255,255,0.1)',
          glow: is3d ? '0 20px 50px rgba(0,0,0,0.6)' : 'none',
          pillBg: 'rgba(255,255,255,0.08)'
        };
      default: // dark glass
        return {
          bg: 'rgba(11, 15, 25, 0.95)',
          text: '#f8fafc',
          subtext: '#94a3b8',
          border: 'rgba(255,255,255,0.08)',
          glow: is3d ? '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
          pillBg: 'rgba(255,255,255,0.06)'
        };
    }
  };

  const bgConfig = getBgStyle();

  // Dynamic framing and dimensions based on chosen aspect ratio
  const getAspectDimensions = () => {
    switch (aspectRatio) {
      case '1:1':
        return {
          maxWidth: '500px',
          minHeight: '500px',
          chartHeight: 330,
          aspectRatio: '1 / 1',
          padding: '24px 22px',
          name: '1:1 Square'
        };
      case '9:16':
        return {
          maxWidth: '340px',
          minHeight: '590px',
          chartHeight: 400,
          aspectRatio: '9 / 16',
          padding: '28px 20px',
          name: '9:16 Story / Reel'
        };
      case '4:3':
        return {
          maxWidth: '640px',
          minHeight: '480px',
          chartHeight: 320,
          aspectRatio: '4 / 3',
          padding: '24px 26px',
          name: '4:3 Presentation'
        };
      case '16:9':
      default:
        return {
          maxWidth: '820px',
          minHeight: '450px',
          chartHeight: 320,
          aspectRatio: '16 / 9',
          padding: '24px 28px',
          name: '16:9 Landscape'
        };
    }
  };

  const aspectDim = getAspectDimensions();

  const handleCopy = () => {
    triggerHaptic('success');
    if (onCopyImage) {
      onCopyImage();
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  };

  const handleCopyRedditTable = async () => {
    if (!data || data.length === 0) return;
    triggerHaptic('success');

    let md = `### ${title || 'Visual Data'}\n`;
    if (subtitle) md += `*${subtitle}*\n\n`;
    if (calloutMetric) md += `> **Key Takeaway:** ${calloutMetric}\n\n`;

    md += `| Category | Value |\n|:---|---:|\n`;
    data.forEach(item => {
      md += `| ${item.name} | ${typeof item.value === 'number' ? item.value.toLocaleString() : item.value} |\n`;
    });
    md += `\n*Visual chart generated with [ChartGenie.xyz](https://chartgenie.xyz/?utm_source=reddit_canvas)*\n`;

    try {
      await navigator.clipboard.writeText(md);
      setJustCopiedReddit(true);
      setTimeout(() => setJustCopiedReddit(false), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleFullscreen = () => {
    triggerHaptic('light');
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px 20px',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 99999 : 'auto',
        background: isFullscreen ? 'rgba(5, 8, 15, 0.96)' : 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        height: isFullscreen ? '100vh' : '100%',
        overflowY: isFullscreen ? 'auto' : 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Floating Control Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Aspect Ratio Quick Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em'
          }}>
            Format:
          </span>
          <div className="aspect-ratio-pill-track">
            {(['16:9', '1:1', '9:16', '4:3'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`aspect-pill-btn ${aspectRatio === r ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  onChangeAspectRatio?.(r);
                }}
                title={
                  r === '16:9' ? '16:9 — Best for X/Twitter & Web' :
                  r === '1:1' ? '1:1 — Best for LinkedIn & Instagram' :
                  r === '9:16' ? '9:16 — Best for Stories & TikTok' :
                  '4:3 — Best for Presentations & Notion'
                }
              >
                {r === '16:9' ? '16:9 (X/Web)' : r === '1:1' ? '1:1 (LinkedIn)' : r === '9:16' ? '9:16 (Story)' : '4:3 (Deck)'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
            {aspectDim.name}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Copy for Reddit */}
          <button
            onClick={handleCopyRedditTable}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              borderColor: 'rgba(255, 69, 0, 0.4)',
              color: '#ff4500'
            }}
            title="Copy formatted Reddit Markdown table with data and source link"
          >
            {justCopiedReddit ? <Check size={14} color="#10b981" /> : <Table size={14} />}
            <span>{justCopiedReddit ? 'Table Copied!' : 'Reddit Table'}</span>
          </button>

          {onCopyImage && (
            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
              title="Copy chart PNG to clipboard (Cmd+V into Twitter/LinkedIn/Reddit)"
            >
              {justCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{justCopied ? 'Copied!' : 'Copy PNG'}</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '8px' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Canvas Interactive Stage Viewport */}
      <div
        className="canvas-stage-viewport"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: bgMode === 'light' ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
          borderRadius: '14px',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          minHeight: 0
        }}
      >
        {/* Target Canvas Div for High-DPI Exporting */}
        <div
          ref={canvasRef}
          id="chart-render-target"
          style={{
            background: bgConfig.bg,
            color: bgConfig.text,
            padding: aspectDim.padding,
            borderRadius: '18px',
            border: `1px solid ${bgConfig.border}`,
            boxShadow: is3d
              ? `${bgConfig.glow}, 0 20px 40px rgba(0,0,0,0.12)`
              : '0 10px 30px rgba(0, 0, 0, 0.07)',
            fontFamily: fontFamily,
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            margin: 'auto',
            maxWidth: isFullscreen ? '900px' : aspectDim.maxWidth,
            minHeight: isFullscreen ? '620px' : aspectDim.minHeight,
            width: '100%'
          }}
        >
        {/* Creator Handle Badge if provided */}
        {creatorHandle && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '20px',
            background: bgConfig.pillBg,
            border: `1px solid ${bgConfig.border}`,
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: bgConfig.text,
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={11} color="#38bdf8" />
            <span>{creatorHandle.startsWith('@') ? creatorHandle : `@${creatorHandle}`}</span>
          </div>
        )}

        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: creatorHandle ? '10px' : '0' }}>
          <h2 style={{
            fontSize: fontSize === 'large' ? '1.85rem' : fontSize === 'small' ? '1.25rem' : (aspectRatio === '9:16' ? '1.55rem' : '1.45rem'),
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: 0,
            color: bgMode === 'light' ? '#1e40af' : bgConfig.text
          }}>
            {title || 'Untitled Chart'}
          </h2>
          {subtitle && (
            <p style={{
              fontSize: '0.85rem',
              color: bgConfig.subtext,
              marginTop: '6px',
              fontWeight: 500
            }}>
              {subtitle}
            </p>
          )}
          {calloutMetric && (
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${bgConfig.border}`,
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: colors[0] || '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                <Sparkles size={12} /> {calloutMetric}
              </span>
            </div>
          )}
        </div>

        {/* Chart Render Area */}
        <div style={{
          width: '100%',
          height: isFullscreen ? 500 : aspectDim.chartHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {(() => {
            const avgValue = Math.round(total / (data.length || 1));
            const shouldShowRefLine = chartType === 'threshold' || showAverageLine;
            const gridStroke = bgMode === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.08)';
            const axisStroke = bgMode === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.1)';

            // 1. 1D Stacked Strip Bar (100% distribution)
            if (chartType === 'stackedBar') {
              const safeTotal = total > 0 ? total : 1;
              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', padding: '16px' }}>
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    border: `1px solid ${bgConfig.border}`
                  }}>
                    {data.map((item, idx) => {
                      const pct = (item.value / safeTotal) * 100;
                      const color = item.color || colors[idx % colors.length];
                      return (
                        <div
                          key={item.id}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: pct > 8 ? '0.78rem' : '0.64rem',
                            textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                            transition: 'all 0.3s ease'
                          }}
                          title={`${item.name}: ${item.value} (${pct.toFixed(1)}%)`}
                        >
                          {pct > 9 ? `${pct.toFixed(0)}%` : ''}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px'
                  }}>
                    {data.map((item, idx) => {
                      const pct = (item.value / safeTotal) * 100;
                      const color = item.color || colors[idx % colors.length];
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: bgConfig.pillBg,
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${bgConfig.border}`
                          }}
                        >
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: bgConfig.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: bgConfig.subtext }}>
                              {item.value.toLocaleString()} ({pct.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 2. Heat Map Matrix
            if (chartType === 'heatmap') {
              const values = data.map(d => Number(d.value) || 0);
              const minVal = values.length ? Math.min(...values) : 0;
              const maxVal = values.length ? Math.max(...values) : 100;
              const range = maxVal - minVal || 1;
              const primaryColor = colors[0] || '#38bdf8';

              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', padding: '10px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: data.length <= 4 ? 'repeat(2, 1fr)' : data.length <= 8 ? 'repeat(4, 1fr)' : 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '10px',
                    width: '100%',
                    maxHeight: '340px',
                    overflowY: 'auto'
                  }}>
                    {data.map((item, idx) => {
                      const ratio = Math.max(0.12, (item.value - minVal) / range);
                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: `color-mix(in srgb, ${primaryColor} ${Math.round(ratio * 85 + 15)}%, ${bgMode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)'})`,
                            border: `1px solid ${ratio > 0.6 ? primaryColor : bgConfig.border}`,
                            borderRadius: '12px',
                            padding: '16px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: ratio > 0.7 ? `0 4px 16px ${primaryColor}33` : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: ratio > 0.5 && bgMode !== 'light' ? '#ffffff' : bgConfig.text, marginBottom: '6px' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: ratio > 0.5 && bgMode !== 'light' ? '#ffffff' : primaryColor }}>
                            {item.value.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: ratio > 0.5 && bgMode !== 'light' ? 'rgba(255,255,255,0.8)' : bgConfig.subtext, marginTop: '2px' }}>
                            {Math.round(ratio * 100)}% Intensity
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.72rem', color: bgConfig.subtext }}>
                    <span>Low ({minVal.toLocaleString()})</span>
                    <div style={{
                      width: '140px',
                      height: '8px',
                      borderRadius: '4px',
                      background: `linear-gradient(to right, ${bgMode === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.15)'}, ${primaryColor})`
                    }} />
                    <span>High ({maxVal.toLocaleString()})</span>
                  </div>
                </div>
              );
            }

            // 3. Gauge / Speedometer Chart
            if (chartType === 'gauge') {
              const primaryVal = data[0]?.value || 0;
              const maxVal = total > primaryVal ? total : Math.max(primaryVal * 1.3, 100);
              const pct = Math.min(100, Math.max(0, Math.round((primaryVal / maxVal) * 100)));
              const primaryColor = colors[0] || '#38bdf8';

              const gaugeData = [
                { name: 'Completed', value: pct, color: primaryColor },
                { name: 'Remaining', value: 100 - pct, color: bgMode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)' }
              ];

              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ width: '280px', height: '180px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="90%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {gaugeData.map((entry, index) => (
                            <Cell key={`gauge-${index}`} fill={entry.color} stroke={bgConfig.bg} strokeWidth={2} />
                          ))}
                        </Pie>
                      </RePieChart>
                    </ResponsiveContainer>

                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, color: primaryColor }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: bgConfig.subtext, marginTop: '4px' }}>
                        {data[0]?.name || 'Target'}: {primaryVal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '0.75rem', color: bgConfig.subtext }}>
                    <span>0</span>
                    <span>Goal: {Math.round(maxVal).toLocaleString()}</span>
                  </div>
                </div>
              );
            }

            // 4. Conversion Funnel Chart
            if (chartType === 'funnel') {
              const topVal = data[0]?.value || 1;
              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                  {data.map((item, idx) => {
                    const ratio = Math.max(0.18, Math.min(1, item.value / topVal));
                    const color = item.color || colors[idx % colors.length];
                    const pctOfTop = Math.round((item.value / topVal) * 100);
                    return (
                      <div key={item.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{
                          width: `${Math.round(ratio * 100)}%`,
                          minWidth: '150px',
                          height: '38px',
                          background: `linear-gradient(90deg, ${color}dd, ${color})`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 14px',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          boxShadow: '0 3px 12px rgba(0,0,0,0.18)',
                          transition: 'all 0.3s ease'
                        }}>
                          <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>{item.value.toLocaleString()}</span>
                            <span style={{ fontSize: '0.68rem', opacity: 0.9, background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '4px' }}>
                              {pctOfTop}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // 5. All Recharts SVG-based Charts
            return (
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
                            innerRadius={chartType === 'donut' ? 70 : 0}
                            outerRadius={120}
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
                    case 'threshold':
                      return (
                        <ReBarChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                          {showGrid && (
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={gridStroke}
                              vertical={false}
                            />
                          )}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: axisStroke }} tickLine={false} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          {showLegend && <Legend verticalAlign="bottom" height={36} />}
                          {shouldShowRefLine && (
                            <ReferenceLine
                              y={avgValue}
                              stroke="#f59e0b"
                              strokeWidth={2.5}
                              strokeDasharray="5 5"
                              label={{
                                value: `Benchmark Avg: ${avgValue.toLocaleString()}`,
                                fill: '#f59e0b',
                                fontSize: 11,
                                fontWeight: 700,
                                position: 'top'
                              }}
                            />
                          )}
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                            ))}
                            {showValues && (
                              <LabelList
                                dataKey="value"
                                position="top"
                                offset={8}
                                fill={bgConfig.subtext}
                                fontSize={12}
                                fontWeight={600}
                              />
                            )}
                          </Bar>
                        </ReBarChart>
                      );

                    case 'horizontalBar':
                      return (
                        <ReBarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          {showGrid && (
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={gridStroke}
                              horizontal={false}
                            />
                          )}
                          <XAxis type="number" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} width={90} />
                          <Tooltip content={<CustomTooltip />} />
                          {showLegend && <Legend verticalAlign="bottom" height={36} />}
                          {shouldShowRefLine && (
                            <ReferenceLine
                              x={avgValue}
                              stroke="#f59e0b"
                              strokeWidth={2.5}
                              strokeDasharray="5 5"
                              label={{
                                value: `Avg: ${avgValue.toLocaleString()}`,
                                fill: '#f59e0b',
                                fontSize: 11,
                                fontWeight: 700,
                                position: 'top'
                              }}
                            />
                          )}
                          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      );

                    case 'stackedColumn': {
                      const prepared = data.map(d => ({
                        ...d,
                        baseVal: Math.round(d.value * 0.7),
                        expVal: Math.round(d.value * 0.3)
                      }));
                      return (
                        <ReBarChart data={prepared} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: axisStroke }} tickLine={false} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Bar dataKey="baseVal" name="Primary Base" stackId="stackA" fill={colors[0]} />
                          <Bar dataKey="expVal" name="Growth Delta" stackId="stackA" fill={colors[1] || '#8b5cf6'} radius={[6, 6, 0, 0]} />
                        </ReBarChart>
                      );
                    }

                    case 'stackedHorizontal': {
                      const prepared = data.map(d => ({
                        ...d,
                        baseVal: Math.round(d.value * 0.7),
                        expVal: Math.round(d.value * 0.3)
                      }));
                      return (
                        <ReBarChart data={prepared} layout="vertical" margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />}
                          <XAxis type="number" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} width={90} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Bar dataKey="baseVal" name="Primary" stackId="stackA" fill={colors[0]} />
                          <Bar dataKey="expVal" name="Expansion" stackId="stackA" fill={colors[1] || '#8b5cf6'} radius={[0, 6, 6, 0]} />
                        </ReBarChart>
                      );
                    }

                    case 'line':
                      return (
                        <ReLineChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                          {showGrid && (
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={gridStroke}
                              vertical={false}
                            />
                          )}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: axisStroke }} tickLine={false} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          {showLegend && <Legend verticalAlign="bottom" height={36} />}
                          {shouldShowRefLine && (
                            <ReferenceLine
                              y={avgValue}
                              stroke="#f59e0b"
                              strokeWidth={2.5}
                              strokeDasharray="5 5"
                              label={{
                                value: `Avg: ${avgValue.toLocaleString()}`,
                                fill: '#f59e0b',
                                fontSize: 11,
                                fontWeight: 700,
                                position: 'top'
                              }}
                            />
                          )}
                          <Line
                            type="linear"
                            dataKey="value"
                            stroke={colors[0]}
                            strokeWidth={3.5}
                            dot={{ r: 5, fill: colors[0], strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 7 }}
                            isAnimationActive={false}
                            label={showValues ? { position: 'top', fill: '#64748b', fontSize: 13, fontWeight: 600, offset: 10 } : false}
                          />
                        </ReLineChart>
                      );

                    case 'stackedLine': {
                      const prepared = data.map(d => ({
                        ...d,
                        benchmark: Math.round(d.value * 0.75)
                      }));
                      return (
                        <ReLineChart data={prepared} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: axisStroke }} tickLine={false} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Actual Series"
                            stroke={colors[0]}
                            strokeWidth={3.5}
                            dot={{ r: 5, fill: colors[0], strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 7 }}
                          />
                          <Line
                            type="stepAfter"
                            dataKey="benchmark"
                            name="Target Baseline"
                            stroke={colors[1] || '#94a3b8'}
                            strokeWidth={2.5}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        </ReLineChart>
                      );
                    }

                    case 'area':
                      return (
                        <ReAreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="areaColorPro" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.7} />
                              <stop offset="95%" stopColor={colors[0]} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          {showLegend && <Legend verticalAlign="bottom" height={36} />}
                          {shouldShowRefLine && (
                            <ReferenceLine
                              y={avgValue}
                              stroke="#f59e0b"
                              strokeWidth={2.5}
                              strokeDasharray="5 5"
                              label={{
                                value: `Avg: ${avgValue.toLocaleString()}`,
                                fill: '#f59e0b',
                                fontSize: 11,
                                fontWeight: 700,
                                position: 'top'
                              }}
                            />
                          )}
                          <Area type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={3} fillOpacity={1} fill="url(#areaColorPro)" />
                        </ReAreaChart>
                      );

                    case 'stackedArea': {
                      const prepared = data.map(d => ({
                        ...d,
                        tierA: Math.round(d.value * 0.65),
                        tierB: Math.round(d.value * 0.35)
                      }));
                      return (
                        <ReAreaChart data={prepared} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="stackedArea1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={colors[0]} stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="stackedArea2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={colors[1] || '#8b5cf6'} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={colors[1] || '#8b5cf6'} stopOpacity={0.2} />
                            </linearGradient>
                          </defs>
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Area type="monotone" dataKey="tierA" name="Segment 1" stackId="1" stroke={colors[0]} fill="url(#stackedArea1)" />
                          <Area type="monotone" dataKey="tierB" name="Segment 2" stackId="1" stroke={colors[1] || '#8b5cf6'} fill="url(#stackedArea2)" />
                        </ReAreaChart>
                      );
                    }

                    case 'radar':
                      return (
                        <ReRadarChart cx="50%" cy="50%" outerRadius={110} data={data}>
                          <PolarGrid stroke={bgConfig.border} />
                          <PolarAngleAxis dataKey="name" tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <PolarRadiusAxis stroke="#64748b" />
                          <Radar name="Value" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
                          <Tooltip content={<CustomTooltip />} />
                        </ReRadarChart>
                      );

                    case 'scatter':
                      return (
                        <ReScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis dataKey="value" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Scatter data={data} fill={colors[0]} />
                        </ReScatterChart>
                      );

                    default:
                      return null;
                  }
                })()}
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* Branding & Attribution Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${bgConfig.border}`,
          fontSize: '0.75rem',
          color: bgConfig.subtext,
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {showWatermark ? (
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: colors[0] }}>●</span> ChartGenie.xyz
              </span>
            ) : (
              <span />
            )}
            <span>Total: {typeof total === 'number' ? total.toLocaleString() : total}</span>
            {dataSource && (
              <span style={{ opacity: 0.85, fontSize: '0.72rem' }}>
                • Source: {dataSource}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onGetShareLink && (
              <button
                type="button"
                className="btn-get-share"
                onClick={onGetShareLink}
              >
                <Link2 size={15} /> Get share link
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                className="btn-download-primary"
                onClick={onDownload}
              >
                <Download size={15} /> Download ▾
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
