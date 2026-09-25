import React, { useState } from 'react';
import { X, Sparkles, PieChart, BarChart2, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { SAMPLE_DATASETS } from '../lib/chartPresets';
import type { DataItem, ChartType } from '../lib/chartPresets';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (data: DataItem[], title: string, subtitle: string, chartType: ChartType) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [filter, setFilter] = useState<'all' | 'business' | 'finance' | 'tech'>('all');

  if (!isOpen) return null;

  const templates = [
    {
      id: 'marketShare',
      category: 'tech',
      title: SAMPLE_DATASETS.marketShare.title,
      subtitle: SAMPLE_DATASETS.marketShare.subtitle,
      chartType: 'pie' as ChartType,
      data: SAMPLE_DATASETS.marketShare.data,
      icon: <PieChart size={20} color="#06b6d4" />
    },
    {
      id: 'revenueGrowth',
      category: 'finance',
      title: SAMPLE_DATASETS.revenueGrowth.title,
      subtitle: SAMPLE_DATASETS.revenueGrowth.subtitle,
      chartType: 'bar' as ChartType,
      data: SAMPLE_DATASETS.revenueGrowth.data,
      icon: <TrendingUp size={20} color="#10b981" />
    },
    {
      id: 'trafficSources',
      category: 'business',
      title: SAMPLE_DATASETS.trafficSources.title,
      subtitle: SAMPLE_DATASETS.trafficSources.subtitle,
      chartType: 'horizontalBar' as ChartType,
      data: SAMPLE_DATASETS.trafficSources.data,
      icon: <BarChart2 size={20} color="#38bdf8" />
    },
    {
      id: 'budgetAllocation',
      category: 'business',
      title: SAMPLE_DATASETS.budgetAllocation.title,
      subtitle: SAMPLE_DATASETS.budgetAllocation.subtitle,
      chartType: 'donut' as ChartType,
      data: SAMPLE_DATASETS.budgetAllocation.data,
      icon: <Layers size={20} color="#a855f7" />
    },
    {
      id: 'cryptoPortfolio',
      category: 'finance',
      title: SAMPLE_DATASETS.cryptoPortfolio.title,
      subtitle: SAMPLE_DATASETS.cryptoPortfolio.subtitle,
      chartType: 'pie' as ChartType,
      data: SAMPLE_DATASETS.cryptoPortfolio.data,
      icon: <DollarSign size={20} color="#f59e0b" />
    },
    {
      id: 'skillRadar',
      category: 'tech',
      title: SAMPLE_DATASETS.skillRadar.title,
      subtitle: SAMPLE_DATASETS.skillRadar.subtitle,
      chartType: 'radar' as ChartType,
      data: SAMPLE_DATASETS.skillRadar.data,
      icon: <Sparkles size={20} color="#ec4899" />
    }
  ];

  const filteredTemplates = filter === 'all' ? templates : templates.filter((t) => t.category === filter);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '720px', padding: '28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={24} color="#06b6d4" />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Chart Template Gallery</h3>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['all', 'business', 'finance', 'tech'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`tab-btn ${filter === cat ? 'active' : ''}`}
              style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl.data, tpl.title, tpl.subtitle, tpl.chartType);
                onClose();
              }}
              className="glass-panel"
              style={{
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  {tpl.icon}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{tpl.chartType}</span>
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#f8fafc', lineHeight: 1.3 }}>{tpl.title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{tpl.subtitle}</p>
              </div>
              
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                <span>Load Template</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
