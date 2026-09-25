import React from 'react';
import { CheckCircle2, Sparkles, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'viral';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '84px', // stays above mobile nav bar
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
      width: 'max-content',
      maxWidth: '90vw'
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className="animate-fade"
          style={{
            pointerEvents: 'auto',
            background: t.type === 'viral'
              ? 'linear-gradient(135deg, rgba(30, 215, 96, 0.95), rgba(6, 182, 212, 0.95))'
              : 'rgba(15, 23, 42, 0.92)',
            border: t.type === 'viral'
              ? '1px solid rgba(255, 255, 255, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.25)',
            backdropFilter: 'blur(12px)',
            color: t.type === 'viral' ? '#000000' : '#ffffff',
            padding: '10px 18px',
            borderRadius: '9999px',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          {t.type === 'viral' ? (
            <Sparkles size={16} />
          ) : t.type === 'success' ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : (
            <Info size={16} color="#38bdf8" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
