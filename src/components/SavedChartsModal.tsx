import React from 'react';
import { X, FolderOpen, Trash2, Calendar, Sparkles, Plus } from 'lucide-react';
import type { SavedChart } from '../lib/storage';
import { triggerHaptic } from '../lib/haptics';

interface SavedChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCharts: SavedChart[];
  onLoadChart: (chart: SavedChart) => void;
  onDeleteChart: (id: string) => void;
  onSaveCurrentAsNew: () => void;
}

export const SavedChartsModal: React.FC<SavedChartsModalProps> = ({
  isOpen,
  onClose,
  savedCharts,
  onLoadChart,
  onDeleteChart,
  onSaveCurrentAsNew
}) => {
  if (!isOpen) return null;

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
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '640px', padding: '24px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Title & Save New Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingRight: '36px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FolderOpen size={24} color="#38bdf8" />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>My Saved Charts</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Local device storage • {savedCharts.length} chart{savedCharts.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('success');
              onSaveCurrentAsNew();
            }}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <Plus size={15} /> Save Current Chart
          </button>
        </div>

        {/* Empty State */}
        {savedCharts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-glass)' }}>
            <Sparkles size={36} color="#6366f1" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>No Saved Charts Yet</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '340px', marginInline: 'auto' }}>
              Save your custom charts here to quickly access or edit them later directly on your device.
            </p>
            <button
              onClick={() => {
                triggerHaptic('success');
                onSaveCurrentAsNew();
              }}
              className="btn-primary"
              style={{ marginTop: '16px', fontSize: '0.82rem' }}
            >
              Save Current Chart Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savedCharts.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      background: 'rgba(99,102,241,0.2)',
                      color: '#a5b4fc',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {item.chartType}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title || 'Untitled Chart'}
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                    {item.data?.length || 0} metrics • {item.subtitle || 'No subtitle'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onLoadChart(item);
                      onClose();
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onDeleteChart(item.id);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '6px', cursor: 'pointer' }}
                    title="Delete saved chart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
