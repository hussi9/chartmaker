import React, { useState } from 'react';
import { Sparkles, Download, Wand2, LayoutGrid, Share2, Check, FolderHeart, Save } from 'lucide-react';
import { encodeChartState } from '../lib/urlState';
import type { DataItem, ChartType } from '../lib/chartPresets';
import { triggerHaptic } from '../lib/haptics';

interface HeaderProps {
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenAiPrompt: () => void;
  onOpenSaved: () => void;
  onQuickSave: () => void;
  savedCount: number;
  chartState: {
    title: string;
    subtitle: string;
    chartType: ChartType;
    schemeId: string;
    data: DataItem[];
  };
  onNotify?: (text: string, type?: 'success' | 'info' | 'viral') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTemplates,
  onOpenExport,
  onOpenAiPrompt,
  onOpenSaved,
  onQuickSave,
  savedCount,
  chartState,
  onNotify
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareLink = () => {
    triggerHaptic('light');
    const encoded = encodeChartState(chartState);
    if (encoded) {
      const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
      triggerHaptic('success');
      onNotify?.('Live interactive link copied! Anyone can view and clone your chart.', 'viral');
    }
  };

  return (
    <header className="glass-panel app-header" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        {/* Brand & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            flexShrink: 0
          }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                ChartGenie<span className="glow-text">.xyz</span>
              </h1>
              <span style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                Viral Pro
              </span>
            </div>
            <p className="header-subtitle" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              Instant AI Charts • 4K Vector Exports • Native App Ready
            </p>
          </div>
        </div>

        {/* Desktop / Tablet Actions Bar */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenTemplates();
            }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 14px' }}
          >
            <LayoutGrid size={15} /> Templates
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onQuickSave();
            }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 14px' }}
            title="Save chart to local device library"
          >
            <Save size={15} /> Save
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenSaved();
            }}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 14px', position: 'relative' }}
          >
            <FolderHeart size={15} color="#ec4899" /> My Charts
            {savedCount > 0 && (
              <span style={{
                background: '#ec4899',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 6px',
                marginLeft: '2px'
              }}>
                {savedCount}
              </span>
            )}
          </button>

          <button
            onClick={handleShareLink}
            className="btn-secondary"
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', padding: '8px 14px' }}
          >
            {copiedShare ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
            {copiedShare ? 'Link Copied!' : 'Share'}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAiPrompt();
            }}
            className="btn-secondary"
            style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#d8b4fe', fontSize: '0.84rem', padding: '8px 14px' }}
          >
            <Wand2 size={15} /> AI Prompt
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenExport();
            }}
            className="btn-primary"
            style={{ fontSize: '0.84rem', padding: '8px 16px' }}
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>
    </header>
  );
};
