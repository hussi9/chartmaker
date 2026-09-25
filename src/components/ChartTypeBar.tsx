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
  GitCommit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { ChartType } from '../lib/chartPresets';
import { triggerHaptic } from '../lib/haptics';

interface ChartTypeBarProps {
  activeType: ChartType;
  onSelectType: (type: ChartType) => void;
}


export interface ChartTypeOption {
  type: ChartType;
  label: string;
  category: 'Bars & Columns' | 'Lines & Trends' | 'Distribution & Matrix' | 'KPIs & Funnels';
  icon: React.ReactNode;
  hint: string;
}

export const ALL_17_CHARTS: ChartTypeOption[] = [
  // 1. Bars & Columns (5)
  { type: 'bar', label: 'Bar', category: 'Bars & Columns', icon: <BarChart3 size={16} />, hint: 'Vertical comparisons' },
  { type: 'horizontalBar', label: 'Horizontal Bar', category: 'Bars & Columns', icon: <AlignLeft size={16} />, hint: 'Best for ranking labels' },
  { type: 'stackedColumn', label: 'Stacked Column', category: 'Bars & Columns', icon: <Columns size={16} />, hint: 'Multi-series breakdown' },
  { type: 'stackedHorizontal', label: 'Stacked Horizontal', category: 'Bars & Columns', icon: <AlignLeft size={16} />, hint: 'Horizontal segments' },
  { type: 'stackedBar', label: '1D Stacked Strip', category: 'Bars & Columns', icon: <Layers size={16} />, hint: '100% full distribution' },

  // 2. Lines & Trends (4)
  { type: 'line', label: 'Line', category: 'Lines & Trends', icon: <TrendingUp size={16} />, hint: 'Continuous trend line' },
  { type: 'stackedLine', label: 'Stacked / Step Line', category: 'Lines & Trends', icon: <GitCommit size={16} />, hint: 'Step & comparative lines' },
  { type: 'area', label: 'Area', category: 'Lines & Trends', icon: <Activity size={16} />, hint: 'Volume & momentum' },
  { type: 'stackedArea', label: 'Stacked Area', category: 'Lines & Trends', icon: <Layers size={16} />, hint: 'Cumulative volume over time' },

  // 3. Distribution & Matrix (5)
  { type: 'pie', label: 'Pie', category: 'Distribution & Matrix', icon: <PieChart size={16} />, hint: 'Proportional slices' },
  { type: 'donut', label: 'Donut', category: 'Distribution & Matrix', icon: <CircleDot size={16} />, hint: 'Modern open-center ring' },
  { type: 'heatmap', label: 'Heat Map Matrix', category: 'Distribution & Matrix', icon: <Grid3X3 size={16} />, hint: 'Intensity heat grid' },
  { type: 'scatter', label: 'Scatter Plot', category: 'Distribution & Matrix', icon: <Activity size={16} />, hint: 'XY correlation points' },
  { type: 'radar', label: 'Radar Matrix', category: 'Distribution & Matrix', icon: <Sliders size={16} />, hint: 'Multi-variable polar map' },

  // 4. KPIs & Funnels (3)
  { type: 'threshold', label: 'Rule Chart (Average)', category: 'KPIs & Funnels', icon: <Target size={16} />, hint: 'Bars with benchmark rule line' },
  { type: 'gauge', label: 'Gauge / Meter', category: 'KPIs & Funnels', icon: <Gauge size={16} />, hint: 'Speedometer goal tracker' },
  { type: 'funnel', label: 'Conversion Funnel', category: 'KPIs & Funnels', icon: <Filter size={16} />, hint: 'Stage-by-stage drop-off' }
];

export type ChartCategory = 'Popular' | 'All' | 'Bars & Columns' | 'Lines & Trends' | 'Distribution & Matrix' | 'KPIs & Funnels';

const POPULAR_TYPES: ChartType[] = ['pie', 'donut', 'line', 'bar', 'area'];

const CATEGORIES: { id: ChartCategory; label: string; count: number }[] = [
  { id: 'Popular', label: 'Popular', count: 5 },
  { id: 'Bars & Columns', label: 'Bars', count: 5 },
  { id: 'Lines & Trends', label: 'Trends', count: 4 },
  { id: 'Distribution & Matrix', label: 'Matrix', count: 5 },
  { id: 'KPIs & Funnels', label: 'KPIs', count: 3 },
  { id: 'All', label: 'All', count: 17 }
];

export const ChartTypeBar: React.FC<ChartTypeBarProps> = ({ activeType, onSelectType }) => {
  const [selectedCategory, setSelectedCategory] = useState<ChartCategory>(() => {
    if (POPULAR_TYPES.includes(activeType)) return 'Popular';
    const match = ALL_17_CHARTS.find(c => c.type === activeType);
    return match ? match.category : 'Popular';
  });
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);

  const railRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter items based on selected category
  const visibleCharts = selectedCategory === 'All'
    ? ALL_17_CHARTS
    : selectedCategory === 'Popular'
    ? ALL_17_CHARTS.filter(c => POPULAR_TYPES.includes(c.type))
    : ALL_17_CHARTS.filter(c => c.category === selectedCategory);

  // Keep category in sync if activeType belongs to another category
  useEffect(() => {
    if (selectedCategory === 'Popular' && !POPULAR_TYPES.includes(activeType)) {
      const match = ALL_17_CHARTS.find(c => c.type === activeType);
      if (match) setSelectedCategory(match.category);
    } else if (selectedCategory !== 'All' && selectedCategory !== 'Popular') {
      const match = ALL_17_CHARTS.find(c => c.type === activeType);
      if (match && match.category !== selectedCategory) {
        setSelectedCategory(match.category);
      }
    }
  }, [activeType]);

  // Handle scroll arrows
  const scrollRail = (direction: 'left' | 'right') => {
    if (railRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      railRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Toggle "More" dropdown with fixed positioning (avoids parent overflow clipping!)
  const toggleMore = () => {
    triggerHaptic('light');
    if (!isMoreOpen && moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect();
      const popupWidth = 280;
      const left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, rect.right - popupWidth));
      setDropdownCoords({
        top: rect.bottom + 6,
        left
      });
      setIsMoreOpen(true);
    } else {
      setIsMoreOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isMoreOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        moreBtnRef.current &&
        !moreBtnRef.current.contains(e.target as Node)
      ) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreOpen]);

  // Reposition on window resize if open
  useEffect(() => {
    const handleResize = () => {
      if (isMoreOpen && moreBtnRef.current) {
        const rect = moreBtnRef.current.getBoundingClientRect();
        const popupWidth = 280;
        const left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, rect.right - popupWidth));
        setDropdownCoords({
          top: rect.bottom + 6,
          left
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMoreOpen]);

  const currentActiveMeta = ALL_17_CHARTS.find(c => c.type === activeType);

  return (
    <div className="chart-type-bar chart-type-selector-wrapper" style={{ position: 'relative' }}>
      {/* Category Filter Pills & More Button Bar */}
      <div className="chart-category-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`chart-cat-pill ${isCatActive ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(cat.id);
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: '0.68rem',
                  opacity: isCatActive ? 1 : 0.65,
                  background: isCatActive ? 'rgba(37, 99, 235, 0.15)' : 'rgba(0,0,0,0.06)',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* More Button (Dropdown with fixed coordinates to prevent any clipping) */}
        <button
          ref={moreBtnRef}
          type="button"
          className="chart-cat-pill"
          style={{
            flexShrink: 0,
            background: isMoreOpen ? '#eff6ff' : '#ffffff',
            borderColor: isMoreOpen ? '#2563eb' : 'var(--border-clean)',
            color: isMoreOpen ? '#1d4ed8' : 'var(--text-secondary)',
            fontWeight: 700
          }}
          onClick={toggleMore}
          title="Browse all 17 chart types categorized"
        >
          <span>More</span>
          <ChevronDown
            size={13}
            style={{
              transform: isMoreOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s ease'
            }}
          />
        </button>
      </div>

      {/* Horizontal Cards Rail with Left & Right Arrows */}
      <div className="chart-cards-track-container">
        <button
          type="button"
          className="track-scroll-btn prev"
          onClick={() => scrollRail('left')}
          title="Scroll left"
          aria-label="Previous charts"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="chart-cards-rail" ref={railRef}>
          {visibleCharts.map((item) => {
            const isActive = activeType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                className={`chart-type-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectType(item.type);
                }}
                title={`${item.label} — ${item.hint}`}
              >
                <span className="type-icon">{item.icon}</span>
                <span className="type-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="track-scroll-btn next"
          onClick={() => scrollRail('right')}
          title="Scroll right"
          aria-label="Next charts"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Active Chart Sub-indicator info */}
      {currentActiveMeta && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
          fontSize: '0.74rem',
          color: '#64748b'
        }}>
          <span>
            Selected: <strong style={{ color: '#1e293b' }}>{currentActiveMeta.label} Preset</strong> ({currentActiveMeta.category}) — {currentActiveMeta.hint}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Showing {visibleCharts.length} of 17 charts
          </span>
        </div>
      )}

      {/* Fixed Popover Dropdown (Guaranteed zero clipping) */}
      {isMoreOpen && dropdownCoords && (
        <div
          ref={dropdownRef}
          className="animate-scale"
          style={{
            position: 'fixed',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            width: '280px',
            maxHeight: '440px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '14px',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.18), 0 8px 16px -6px rgba(0, 0, 0, 0.1)',
            padding: '8px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {(['Bars & Columns', 'Lines & Trends', 'Distribution & Matrix', 'KPIs & Funnels'] as const).map((cat) => {
            const items = ALL_17_CHARTS.filter(m => m.category === cat);
            return (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  padding: '4px 8px 2px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{cat}</span>
                  <span style={{ fontSize: '0.64rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: '8px' }}>
                    {items.length}
                  </span>
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
                        justifyContent: 'space-between',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: isSelected ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center' }}>
                          {m.icon}
                        </span>
                        <span>{m.label}</span>
                      </div>
                      {isSelected && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
