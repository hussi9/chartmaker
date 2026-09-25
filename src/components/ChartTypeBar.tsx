import React, { useState, useRef, useEffect } from 'react';
import {
  PieChart,
  CircleDot,
  TrendingUp,
  BarChart3,
  Activity,
  Layers,
  Sliders,
  ChevronDown,
  Columns,
  AlignLeft,
  Target,
  Grid3X3,
  Gauge,
  Filter,
  GitCommit
} from 'lucide-react';
import type { ChartType } from '../lib/chartPresets';
import { triggerHaptic } from '../lib/haptics';

interface ChartTypeBarProps {
  activeType: ChartType;
  onSelectType: (type: ChartType) => void;
}

const PRIMARY_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'pie', label: 'Pie', icon: <PieChart size={18} /> },
  { type: 'donut', label: 'Donut', icon: <CircleDot size={18} /> },
  { type: 'line', label: 'Line', icon: <TrendingUp size={18} /> },
  { type: 'bar', label: 'Bar', icon: <BarChart3 size={18} /> },
  { type: 'area', label: 'Area', icon: <Activity size={18} /> }
];

export interface ChartTypeOption {
  type: ChartType;
  label: string;
  category: 'Bars & Columns' | 'Lines & Trends' | 'Distribution & Matrix' | 'KPIs & Funnels';
  icon: React.ReactNode;
}

const MORE_TYPES: ChartTypeOption[] = [
  { type: 'horizontalBar', label: 'Horizontal Bar', category: 'Bars & Columns', icon: <AlignLeft size={16} /> },
  { type: 'stackedBar', label: '1D Stacked Strip', category: 'Bars & Columns', icon: <Layers size={16} /> },
  { type: 'stackedColumn', label: 'Stacked Column', category: 'Bars & Columns', icon: <Columns size={16} /> },
  { type: 'stackedHorizontal', label: 'Stacked Horizontal', category: 'Bars & Columns', icon: <AlignLeft size={16} /> },
  { type: 'stackedArea', label: 'Stacked Area', category: 'Lines & Trends', icon: <Layers size={16} /> },
  { type: 'stackedLine', label: 'Stacked / Step Line', category: 'Lines & Trends', icon: <GitCommit size={16} /> },
  { type: 'threshold', label: 'Rule Chart (Average)', category: 'Lines & Trends', icon: <Target size={16} /> },
  { type: 'heatmap', label: 'Heat Map Matrix', category: 'Distribution & Matrix', icon: <Grid3X3 size={16} /> },
  { type: 'scatter', label: 'Scatter Plot', category: 'Distribution & Matrix', icon: <Activity size={16} /> },
  { type: 'radar', label: 'Radar Matrix', category: 'Distribution & Matrix', icon: <Sliders size={16} /> },
  { type: 'gauge', label: 'Gauge / Meter', category: 'KPIs & Funnels', icon: <Gauge size={16} /> },
  { type: 'funnel', label: 'Conversion Funnel', category: 'KPIs & Funnels', icon: <Filter size={16} /> }
];

export const ChartTypeBar: React.FC<ChartTypeBarProps> = ({ activeType, onSelectType }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const isMoreActive = MORE_TYPES.some(t => t.type === activeType);
  const currentMoreItem = MORE_TYPES.find(t => t.type === activeType);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="chart-type-bar">
      {PRIMARY_TYPES.map((t) => {
        const isActive = activeType === t.type;
        return (
          <button
            key={t.type}
            type="button"
            className={`chart-type-card ${isActive ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              onSelectType(t.type);
            }}
          >
            <span className="type-icon">{t.icon}</span>
            <span className="type-label">{t.label}</span>
          </button>
        );
      })}

      {/* More Types Dropdown Menu */}
      <div ref={moreRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className={`chart-type-card ${isMoreActive ? 'active' : ''}`}
          onClick={() => {
            triggerHaptic('light');
            setIsMoreOpen(!isMoreOpen);
          }}
          style={{ minWidth: '120px' }}
        >
          <span className="type-icon">
            {isMoreActive && currentMoreItem ? currentMoreItem.icon : <Layers size={18} />}
          </span>
          <span className="type-label">
            {isMoreActive && currentMoreItem ? currentMoreItem.label.split(' ')[0] : 'More'}
          </span>
          <ChevronDown size={14} style={{ marginLeft: '2px', transform: isMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>

        {isMoreOpen && (
          <div
            className="animate-scale"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
              padding: '8px',
              minWidth: '260px',
              maxHeight: '420px',
              overflowY: 'auto',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {(['Bars & Columns', 'Lines & Trends', 'Distribution & Matrix', 'KPIs & Funnels'] as const).map((cat) => {
              const items = MORE_TYPES.filter(m => m.category === cat);
              return (
                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.06em',
                    padding: '4px 8px 2px'
                  }}>
                    {cat}
                  </div>
                  {items.map((m) => {
                    const isSelected = activeType === m.type;
                    return (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          onSelectType(m.type);
                          setIsMoreOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          color: isSelected ? '#1d4ed8' : '#334155',
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <span style={{ color: isSelected ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center' }}>
                          {m.icon}
                        </span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
