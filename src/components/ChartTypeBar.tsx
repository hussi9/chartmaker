import React, { useState, useRef, useEffect } from 'react';
import { PieChart, CircleDot, TrendingUp, BarChart3, Activity, Layers, Sliders, ChevronDown } from 'lucide-react';
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

const MORE_TYPES: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'stackedBar', label: 'Stacked Strip (100%)', icon: <Layers size={16} /> },
  { type: 'horizontalBar', label: 'Horizontal Bar', icon: <BarChart3 size={16} style={{ transform: 'rotate(90deg)' }} /> },
  { type: 'radar', label: 'Radar Matrix', icon: <Sliders size={16} /> },
  { type: 'scatter', label: 'Scatter Plot', icon: <Activity size={16} /> }
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
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '6px',
              minWidth: '200px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            {MORE_TYPES.map((m) => {
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? '#eff6ff' : 'transparent',
                    color: isSelected ? '#1d4ed8' : '#334155',
                    fontWeight: isSelected ? 600 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ color: isSelected ? '#2563eb' : '#64748b' }}>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
