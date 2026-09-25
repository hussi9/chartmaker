import React, { useState } from 'react';
import { X, Sparkles, PieChart, BarChart2, TrendingUp, DollarSign, Layers, Flame, Laugh } from 'lucide-react';
import { SAMPLE_DATASETS } from '../lib/chartPresets';
import type { DataItem, ChartType } from '../lib/chartPresets';
import { triggerHaptic } from '../lib/haptics';

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
  const [filter, setFilter] = useState<'all' | 'viral' | 'business' | 'finance' | 'tech'>('all');

  if (!isOpen) return null;

  const templates = [
    {
      id: 'memeCoding',
      category: 'viral',
      title: SAMPLE_DATASETS.memeCoding.title,
      subtitle: SAMPLE_DATASETS.memeCoding.subtitle,
      chartType: SAMPLE_DATASETS.memeCoding.chartType,
      data: SAMPLE_DATASETS.memeCoding.data,
      icon: <Laugh size={20} color="#ff007a" />,
      tag: '🔥 Viral Meme'
    },
    {
      id: 'memeSalary',
      category: 'viral',
      title: SAMPLE_DATASETS.memeSalary.title,
      subtitle: SAMPLE_DATASETS.memeSalary.subtitle,
      chartType: SAMPLE_DATASETS.memeSalary.chartType,
      data: SAMPLE_DATASETS.memeSalary.data,
      icon: <Flame size={20} color="#f59e0b" />,
      tag: '🔥 Relatable'
    },
    {
      id: 'memeMeeting',
      category: 'viral',
      title: SAMPLE_DATASETS.memeMeeting.title,
      subtitle: SAMPLE_DATASETS.memeMeeting.subtitle,
      chartType: SAMPLE_DATASETS.memeMeeting.chartType,
      data: SAMPLE_DATASETS.memeMeeting.data,
      icon: <Laugh size={20} color="#1ed760" />,
      tag: '🔥 Work Life'
    },
    {
      id: 'aiMarket',
      category: 'tech',
      title: SAMPLE_DATASETS.aiMarket.title,
      subtitle: SAMPLE_DATASETS.aiMarket.subtitle,
      chartType: SAMPLE_DATASETS.aiMarket.chartType,
      data: SAMPLE_DATASETS.aiMarket.data,
      icon: <Sparkles size={20} color="#a855f7" />,
      tag: '⚡ 2026 Trend'
    },
    {
      id: 'marketShare',
      category: 'tech',
      title: SAMPLE_DATASETS.marketShare.title,
      subtitle: SAMPLE_DATASETS.marketShare.subtitle,
      chartType: SAMPLE_DATASETS.marketShare.chartType,
      data: SAMPLE_DATASETS.marketShare.data,
      icon: <PieChart size={20} color="#06b6d4" />,
      tag: 'Tech Market'
    },
    {
      id: 'revenueGrowth',
      category: 'finance',
      title: SAMPLE_DATASETS.revenueGrowth.title,
      subtitle: SAMPLE_DATASETS.revenueGrowth.subtitle,
      chartType: SAMPLE_DATASETS.revenueGrowth.chartType,
      data: SAMPLE_DATASETS.revenueGrowth.data,
      icon: <TrendingUp size={20} color="#10b981" />,
      tag: 'SaaS Metric'
    },
    {
      id: 'trafficSources',
      category: 'business',
      title: SAMPLE_DATASETS.trafficSources.title,
      subtitle: SAMPLE_DATASETS.trafficSources.subtitle,
      chartType: SAMPLE_DATASETS.trafficSources.chartType,
      data: SAMPLE_DATASETS.trafficSources.data,
      icon: <BarChart2 size={20} color="#38bdf8" />,
      tag: 'Acquisition'
    },
    {
      id: 'budgetAllocation',
      category: 'business',
      title: SAMPLE_DATASETS.budgetAllocation.title,
      subtitle: SAMPLE_DATASETS.budgetAllocation.subtitle,
      chartType: SAMPLE_DATASETS.budgetAllocation.chartType,
      data: SAMPLE_DATASETS.budgetAllocation.data,
      icon: <Layers size={20} color="#a855f7" />,
      tag: 'Strategy'
    },
    {
      id: 'cryptoPortfolio',
      category: 'finance',
      title: SAMPLE_DATASETS.cryptoPortfolio.title,
      subtitle: SAMPLE_DATASETS.cryptoPortfolio.subtitle,
      chartType: SAMPLE_DATASETS.cryptoPortfolio.chartType,
      data: SAMPLE_DATASETS.cryptoPortfolio.data,
      icon: <DollarSign size={20} color="#f59e0b" />,
      tag: 'Crypto'
    },
    {
      id: 'skillRadar',
      category: 'tech',
      title: SAMPLE_DATASETS.skillRadar.title,
      subtitle: SAMPLE_DATASETS.skillRadar.subtitle,
      chartType: SAMPLE_DATASETS.skillRadar.chartType,
      data: SAMPLE_DATASETS.skillRadar.data,
      icon: <Sparkles size={20} color="#ec4899" />,
      tag: 'Matrix'
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
      background: 'rgba(5, 8, 15, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '780px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
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
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Viral & Pro Chart Templates</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>1-tap launch relatable social charts & business reports</p>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(['all', 'viral', 'business', 'finance', 'tech'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic('light');
                setFilter(cat);
              }}
              className={`tab-btn ${filter === cat ? 'active' : ''}`}
              style={{
                textTransform: 'capitalize',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {cat === 'viral' ? '🔥 Viral & Memes' : cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                triggerHaptic('medium');
                onSelectTemplate(tpl.data, tpl.title, tpl.subtitle, tpl.chartType);
                onClose();
              }}
              className="glass-panel"
              style={{
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: tpl.category === 'viral' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: tpl.category === 'viral' ? 'rgba(236, 72, 153, 0.05)' : 'var(--bg-card)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  {tpl.icon}
                  <span style={{
                    fontSize: '0.68rem',
                    color: tpl.category === 'viral' ? '#f472b6' : 'var(--text-muted)',
                    background: tpl.category === 'viral' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(255,255,255,0.05)',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 700
                  }}>
                    {tpl.tag}
                  </span>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#f8fafc', lineHeight: 1.35 }}>{tpl.title}</h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>{tpl.subtitle}</p>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
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
