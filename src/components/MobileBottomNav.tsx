import React from 'react';
import { BarChart3, FileSpreadsheet, Palette, Sparkles, FolderHeart } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export type MobileTab = 'canvas' | 'data' | 'style';

interface MobileBottomNavProps {
  currentTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  onOpenTemplates: () => void;
  onOpenSaved: () => void;
  savedCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenTemplates,
  onOpenSaved,
  savedCount
}) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-nav-btn ${currentTab === 'canvas' ? 'active' : ''}`}
        onClick={() => {
          triggerHaptic('light');
          onChangeTab('canvas');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <BarChart3 size={20} />
        <span>Canvas</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentTab === 'data' ? 'active' : ''}`}
        onClick={() => {
          triggerHaptic('light');
          onChangeTab('data');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <FileSpreadsheet size={20} />
        <span>Data</span>
      </button>

      <button
        className={`mobile-nav-btn ${currentTab === 'style' ? 'active' : ''}`}
        onClick={() => {
          triggerHaptic('light');
          onChangeTab('style');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Palette size={20} />
        <span>Theme</span>
      </button>

      <button
        className="mobile-nav-btn"
        onClick={() => {
          triggerHaptic('light');
          onOpenTemplates();
        }}
      >
        <Sparkles size={20} color="#06b6d4" />
        <span>Templates</span>
      </button>

      <button
        className="mobile-nav-btn"
        onClick={() => {
          triggerHaptic('light');
          onOpenSaved();
        }}
        style={{ position: 'relative' }}
      >
        <FolderHeart size={20} color="#ec4899" />
        <span>Saved</span>
        {savedCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '24%',
            background: '#ec4899',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontWeight: 800,
            borderRadius: '999px',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {savedCount}
          </span>
        )}
      </button>
    </nav>
  );
};
