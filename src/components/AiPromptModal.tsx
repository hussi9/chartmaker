import React, { useState } from 'react';
import { Wand2, X, Sparkles, ArrowRight } from 'lucide-react';
import { parseNaturalLanguagePrompt } from '../lib/aiParser';
import type { DataItem, ChartType } from '../lib/chartPresets';
import { triggerHaptic } from '../lib/haptics';

interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (result: { data: DataItem[]; title: string; subtitle: string; chartType?: ChartType }) => void;
}

const SAMPLE_PROMPTS = [
  'Tesla: 1.8M, Ford: 4.4M, BYD: 3.0M, GM: 6.2M',
  'Monthly spending: Rent $1500, Food $450, Savings $600, Fun $200',
  'Quarterly sales Q1: 120, Q2: 250, Q3: 410, Q4: 680',
  'Browser market share: Chrome 65%, Safari 20%, Edge 10%, Others 5%'
];

export const AiPromptModal: React.FC<AiPromptModalProps> = ({ isOpen, onClose, onApplyPrompt }) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    triggerHaptic('medium');
    const result = parseNaturalLanguagePrompt(prompt);
    onApplyPrompt({
      data: result.data,
      title: result.title,
      subtitle: result.subtitle,
      chartType: result.recommendedType
    });
    onClose();
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose}>
      <div className="modal-card animate-scale" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Wand2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                AI Smart Chart Generator
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Type numbers, percentages, or paste notes in plain English
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. iPhone: 45%, Samsung: 30%, Xiaomi: 15%, Others: 10%"
            rows={4}
            className="clean-input"
            style={{ width: '100%', fontSize: '0.9rem', lineHeight: '1.5' }}
            autoFocus
          />

          <div style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Or try a quick example:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    textAlign: 'left',
                    fontSize: '0.78rem',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{sample}</span>
                  <ArrowRight size={12} color="#94a3b8" />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-download-primary"
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={14} /> Generate Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
