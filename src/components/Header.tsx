import React from 'react';
import { Sparkles, Download, Wand2, PieChart, BarChart2, TrendingUp } from 'lucide-react';
import { SAMPLE_DATASETS } from '../lib/chartPresets';

interface HeaderProps {
  onSelectPreset: (key: keyof typeof SAMPLE_DATASETS) => void;
  onOpenExport: () => void;
  onOpenAiPrompt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onOpenExport,
  onOpenAiPrompt
}) => {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                ChartGenie<span className="glow-text">.xyz</span>
              </h1>
              <span style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                AI 2.0
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Instant AI-Assisted Chart & Graph Generator • Vector SVG & 4K Retina
            </p>
          </div>
        </div>

        {/* Quick Presets & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => onSelectPreset('marketShare')}
              className="tab-btn"
              title="Load Market Share Preset"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PieChart size={14} /> Market Share
            </button>
            <button
              onClick={() => onSelectPreset('revenueGrowth')}
              className="tab-btn"
              title="Load SaaS Revenue Preset"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TrendingUp size={14} /> Revenue
            </button>
            <button
              onClick={() => onSelectPreset('trafficSources')}
              className="tab-btn"
              title="Load Traffic Sources Preset"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <BarChart2 size={14} /> Traffic
            </button>
          </div>

          <button
            onClick={onOpenAiPrompt}
            className="btn-secondary"
            style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#d8b4fe' }}
          >
            <Wand2 size={16} /> AI Prompt
          </button>

          <button onClick={onOpenExport} className="btn-primary">
            <Download size={16} /> Export Chart
          </button>
        </div>
      </div>
    </header>
  );
};
