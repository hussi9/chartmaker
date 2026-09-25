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
import { Maximize2, Minimize2, Copy, Sparkles, Check, Link2, Download, Table, Box } from 'lucide-react';
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
  onToggle3d?: () => void;
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

// Pure Lightweight Native SVG 3D Filters & Cylindrical Shading (Zero Heavy Libraries)
const Svg3dDefs: React.FC<{ data: DataItem[]; colors: string[]; is3d: boolean; bgMode: CanvasThemeMode }> = ({ data, colors, is3d, bgMode }) => (
  <defs>
    {/* 1. Multi-tier drop shadow filter for solid 3D depth */}
    <filter id="solid3dShadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow
        dx="1.5"
        dy={is3d ? "6" : "2"}
        stdDeviation={is3d ? "4" : "1.8"}
        floodColor="#000000"
        floodOpacity={bgMode === 'light' ? (is3d ? "0.26" : "0.12") : (is3d ? "0.55" : "0.25")}
      />
      {is3d && (
        <feDropShadow
          dx="0"
          dy="1"
          stdDeviation="1.5"
          floodColor="#000000"
          floodOpacity="0.2"
        />
      )}
    </filter>

    {/* 2. Floating Circular Disc Shadow for Pie / Donut */}
    <filter id="solid3dFloat" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow
        dx="0"
        dy={is3d ? "10" : "4"}
        stdDeviation={is3d ? "8" : "3"}
        floodColor="#000000"
        floodOpacity={bgMode === 'light' ? (is3d ? "0.32" : "0.14") : (is3d ? "0.62" : "0.28")}
      />
    </filter>

    {/* 3. Cylindrical Gradients for each data item */}
    {data.map((item, idx) => {
      const baseColor = item.color || colors[idx % colors.length] || '#3b82f6';
      return (
        <React.Fragment key={`grad-defs-${item.id || idx}`}>
          {/* Vertical 3D Cylinder: Left specular highlight, rich core body, right cast shadow */}
          <linearGradient id={`cylindrical-v-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={is3d ? 0.42 : 0} />
            <stop offset="18%" stopColor={baseColor} stopOpacity={1} />
            <stop offset="78%" stopColor={baseColor} stopOpacity={1} />
            <stop offset="100%" stopColor="#000000" stopOpacity={is3d ? 0.35 : 0} />
          </linearGradient>

          {/* Horizontal 3D Cylinder: Top specular highlight, rich core body, bottom cast shadow */}
          <linearGradient id={`cylindrical-h-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={is3d ? 0.42 : 0} />
            <stop offset="22%" stopColor={baseColor} stopOpacity={1} />
            <stop offset="78%" stopColor={baseColor} stopOpacity={1} />
            <stop offset="100%" stopColor="#000000" stopOpacity={is3d ? 0.35 : 0} />
          </linearGradient>
        </React.Fragment>
      );
    })}

    {/* 4. Area Chart 3D Glowing Surface Gradients */}
    <linearGradient id="areaColorPro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={colors[0] || '#3b82f6'} stopOpacity={is3d ? 0.88 : 0.65} />
      <stop offset="60%" stopColor={colors[0] || '#3b82f6'} stopOpacity={is3d ? 0.35 : 0.15} />
      <stop offset="100%" stopColor={colors[0] || '#3b82f6'} stopOpacity={0.0} />
    </linearGradient>

    <linearGradient id="stackedArea1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={colors[0] || '#3b82f6'} stopOpacity={is3d ? 0.88 : 0.75} />
      <stop offset="100%" stopColor={colors[0] || '#3b82f6'} stopOpacity={is3d ? 0.25 : 0.1} />
    </linearGradient>

    <linearGradient id="stackedArea2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={colors[1] || '#8b5cf6'} stopOpacity={is3d ? 0.88 : 0.75} />
      <stop offset="100%" stopColor={colors[1] || '#8b5cf6'} stopOpacity={is3d ? 0.25 : 0.1} />
    </linearGradient>
  </defs>
);

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
  onToggle3d,
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
          {/* Quick 3D Depth Toggle */}
          {onToggle3d && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onToggle3d();
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '8px',
                background: is3d ? (bgMode === 'light' ? '#eff6ff' : 'rgba(37, 99, 235, 0.25)') : undefined,
                borderColor: is3d ? '#2563eb' : undefined,
                color: is3d ? (bgMode === 'light' ? '#1d4ed8' : '#60a5fa') : undefined,
                fontWeight: is3d ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={is3d ? "3D visual depth & specular lighting is active (click to switch to 2D)" : "Enable solid 3D visual depth, cylindrical gradients, and specular lighting"}
            >
              <Box size={13} />
              <span>{is3d ? '3D Solid On' : '3D Depth'}</span>
            </button>
          )}

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
                    height: is3d ? '54px' : '48px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: is3d
                      ? '0 10px 28px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.45)'
                      : '0 4px 20px rgba(0,0,0,0.4)',
                    border: `1px solid ${bgConfig.border}`,
                    transition: 'all 0.3s ease'
                  }}>
                    {data.map((item, idx) => {
                      const pct = (item.value / safeTotal) * 100;
                      const color = item.color || colors[idx % colors.length];
                      return (
                        <div
                          key={item.id}
                          style={{
                            width: `${pct}%`,
                            background: is3d
                              ? `linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.06) 48%, rgba(0,0,0,0.32) 100%), ${color}`
                              : color,
                            boxShadow: is3d
                              ? 'inset 0 2px 2px rgba(255,255,255,0.5), inset 0 -2px 3px rgba(0,0,0,0.4)'
                              : 'none',
                            borderRight: '1px solid rgba(0,0,0,0.2)',
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
                            background: is3d
                              ? `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.12) 100%), color-mix(in srgb, ${primaryColor} ${Math.round(ratio * 85 + 15)}%, ${bgMode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)'})`
                              : `color-mix(in srgb, ${primaryColor} ${Math.round(ratio * 85 + 15)}%, ${bgMode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)'})`,
                            border: is3d ? '1px solid rgba(255,255,255,0.35)' : `1px solid ${ratio > 0.6 ? primaryColor : bgConfig.border}`,
                            borderRadius: '12px',
                            padding: '16px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            boxShadow: is3d
                              ? '0 6px 14px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.25)'
                              : (ratio > 0.7 ? `0 4px 16px ${primaryColor}33` : 'none'),
                            transform: is3d ? 'translateY(-2px)' : 'none',
                            transition: 'all 0.25s ease'
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
                  <div style={{
                    width: '280px',
                    height: '180px',
                    position: 'relative',
                    filter: is3d ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))' : 'none',
                    transition: 'filter 0.3s ease'
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
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
                      <div style={{
                        fontSize: '2.4rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        color: primaryColor,
                        textShadow: is3d ? '0 3px 10px rgba(0,0,0,0.35)' : 'none'
                      }}>
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
                          height: is3d ? '42px' : '38px',
                          background: is3d
                            ? `linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.28) 100%), ${color}`
                            : `linear-gradient(90deg, ${color}dd, ${color})`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 14px',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          boxShadow: is3d
                            ? '0 8px 20px rgba(0,0,0,0.28), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.35)'
                            : '0 3px 12px rgba(0,0,0,0.18)',
                          transform: is3d ? 'translateY(-1px)' : 'none',
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
                        <RePieChart style={{
                          transform: is3d ? 'perspective(700px) rotateX(18deg) scale(0.96)' : 'none',
                          filter: is3d ? 'drop-shadow(0 16px 24px rgba(0,0,0,0.32))' : 'none',
                          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease'
                        }}>
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          <Tooltip content={<CustomTooltip />} />
                          {showLegend && <Legend verticalAlign="bottom" height={36} />}
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={chartType === 'donut' ? 70 : 0}
                            outerRadius={120}
                            paddingAngle={chartType === 'donut' ? 4 : (is3d ? 3 : 2)}
                            dataKey="value"
                            filter={is3d ? "url(#solid3dFloat)" : undefined}
                            label={showValues ? ({ name, percent }: { name?: string; percent?: number }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%` : false}
                            labelLine={showValues}
                          >
                            {data.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color || colors[index % colors.length]}
                                stroke={is3d ? 'rgba(255,255,255,0.45)' : bgConfig.bg}
                                strokeWidth={is3d ? 2.5 : 2}
                              />
                            ))}
                          </Pie>
                        </RePieChart>
                      );

                    case 'bar':
                    case 'threshold':
                      return (
                        <ReBarChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
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
                              strokeWidth={is3d ? 3 : 2.5}
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
                          <Bar
                            dataKey="value"
                            radius={is3d ? [8, 8, 0, 0] : [6, 6, 0, 0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          >
                            {data.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={is3d ? `url(#cylindrical-v-${index})` : (entry.color || colors[index % colors.length])}
                                stroke={is3d ? 'rgba(255,255,255,0.22)' : undefined}
                                strokeWidth={is3d ? 1 : 0}
                              />
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
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
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
                              strokeWidth={is3d ? 3 : 2.5}
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
                          <Bar
                            dataKey="value"
                            radius={is3d ? [0, 8, 8, 0] : [0, 6, 6, 0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          >
                            {data.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={is3d ? `url(#cylindrical-h-${index})` : (entry.color || colors[index % colors.length])}
                                stroke={is3d ? 'rgba(255,255,255,0.22)' : undefined}
                                strokeWidth={is3d ? 1 : 0}
                              />
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
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: axisStroke }} tickLine={false} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Bar
                            dataKey="baseVal"
                            name="Primary Base"
                            stackId="stackA"
                            fill={is3d ? 'url(#cylindrical-v-0)' : colors[0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
                          <Bar
                            dataKey="expVal"
                            name="Growth Delta"
                            stackId="stackA"
                            fill={is3d ? 'url(#cylindrical-v-1)' : (colors[1] || '#8b5cf6')}
                            radius={is3d ? [8, 8, 0, 0] : [6, 6, 0, 0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
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
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />}
                          <XAxis type="number" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} width={90} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Bar
                            dataKey="baseVal"
                            name="Primary"
                            stackId="stackA"
                            fill={is3d ? 'url(#cylindrical-h-0)' : colors[0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
                          <Bar
                            dataKey="expVal"
                            name="Expansion"
                            stackId="stackA"
                            fill={is3d ? 'url(#cylindrical-h-1)' : (colors[1] || '#8b5cf6')}
                            radius={is3d ? [0, 8, 8, 0] : [0, 6, 6, 0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
                        </ReBarChart>
                      );
                    }

                    case 'line':
                      return (
                        <ReLineChart data={data} margin={{ top: 25, right: 30, left: 10, bottom: 20 }}>
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
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
                              strokeWidth={is3d ? 3 : 2.5}
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
                            strokeWidth={is3d ? 5 : 3.5}
                            dot={is3d ? { r: 6.5, fill: colors[0], strokeWidth: 3, stroke: '#ffffff', filter: 'url(#solid3dShadow)' } : { r: 5, fill: colors[0], strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 8 }}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
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
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
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
                            strokeWidth={is3d ? 5 : 3.5}
                            dot={is3d ? { r: 6.5, fill: colors[0], strokeWidth: 3, stroke: '#ffffff', filter: 'url(#solid3dShadow)' } : { r: 5, fill: colors[0], strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 8 }}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
                          <Line
                            type="stepAfter"
                            dataKey="benchmark"
                            name="Target Baseline"
                            stroke={colors[1] || '#94a3b8'}
                            strokeWidth={is3d ? 3.5 : 2.5}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        </ReLineChart>
                      );
                    }

                    case 'area':
                      return (
                        <ReAreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          {showLegend && <Legend verticalAlign="bottom" height={36} />}
                          {shouldShowRefLine && (
                            <ReferenceLine
                              y={avgValue}
                              stroke="#f59e0b"
                              strokeWidth={is3d ? 3 : 2.5}
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
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={colors[0]}
                            strokeWidth={is3d ? 4 : 3}
                            fillOpacity={1}
                            fill="url(#areaColorPro)"
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
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
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />}
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} />
                          <Area
                            type="monotone"
                            dataKey="tierA"
                            name="Segment 1"
                            stackId="1"
                            stroke={colors[0]}
                            strokeWidth={is3d ? 3 : 2}
                            fill="url(#stackedArea1)"
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
                          <Area
                            type="monotone"
                            dataKey="tierB"
                            name="Segment 2"
                            stackId="1"
                            stroke={colors[1] || '#8b5cf6'}
                            strokeWidth={is3d ? 3 : 2}
                            fill="url(#stackedArea2)"
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
                        </ReAreaChart>
                      );
                    }

                    case 'radar':
                      return (
                        <ReRadarChart cx="50%" cy="50%" outerRadius={110} data={data}>
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          <PolarGrid stroke={bgConfig.border} />
                          <PolarAngleAxis dataKey="name" tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <PolarRadiusAxis stroke="#64748b" />
                          <Radar
                            name="Value"
                            dataKey="value"
                            stroke={colors[0]}
                            strokeWidth={is3d ? 3 : 2}
                            fill={colors[0]}
                            fillOpacity={is3d ? 0.75 : 0.6}
                            filter={is3d ? "url(#solid3dFloat)" : undefined}
                          />
                          <Tooltip content={<CustomTooltip />} />
                        </ReRadarChart>
                      );

                    case 'scatter':
                      return (
                        <ReScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                          <Svg3dDefs data={data} colors={colors} is3d={is3d} bgMode={bgMode} />
                          <XAxis dataKey="name" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <YAxis dataKey="value" stroke={bgConfig.subtext} tick={{ fill: bgConfig.text, fontSize: 11 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Scatter
                            data={data}
                            fill={colors[0]}
                            filter={is3d ? "url(#solid3dShadow)" : undefined}
                          />
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
