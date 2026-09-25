import React, { useState } from 'react';
import { Sparkles, Download, Wand2, LayoutGrid, Share2, Check } from 'lucide-react';
import { encodeChartState } from '../lib/urlState';
import type { DataItem, ChartType } from '../lib/chartPresets';

interface HeaderProps {
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenAiPrompt: () => void;
  chartState: {
    title: string;
    subtitle: string;
    chartType: ChartType;
    schemeId: string;
    data: DataItem[];
  };
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTemplates,
  onOpenExport,
  onOpenAiPrompt,
  chartState
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareLink = () => {
    const encoded = encodeChartState(chartState);
    if (encoded) {
      const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

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
                PRO MAX
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              AI-Powered Data Visualization Suite • Live URL Sharing & Vector SVG
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenTemplates}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LayoutGrid size={16} /> Template Gallery
          </button>

          <button
            onClick={handleShareLink}
            className="btn-secondary"
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copiedShare ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
            {copiedShare ? 'Link Copied!' : 'Share Live Chart'}
          </button>

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
