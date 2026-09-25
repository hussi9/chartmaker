import React, { useState } from 'react';
import { X, Download, Copy, Code, Check, Sparkles } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import confetti from 'canvas-confetti';
import { trackEvent } from '../lib/gtag';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  chartTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  chartTitle
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const sanitizeFilename = (title: string) => {
    return (title || 'chartgenie-export')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Export PNG
  const handleDownloadPng = async (pixelRatio: number) => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio, backgroundColor: '#090d16' });
      const link = document.createElement('a');
      link.download = `${sanitizeFilename(chartTitle)}-${pixelRatio}x.png`;
      link.href = dataUrl;
      link.click();

      trackEvent('export_png', 'export', chartTitle, pixelRatio);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export SVG
  const handleDownloadSvg = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toSvg(canvasRef.current, { backgroundColor: '#090d16' });
      const link = document.createElement('a');
      link.download = `${sanitizeFilename(chartTitle)}.svg`;
      link.href = dataUrl;
      link.click();

      trackEvent('export_svg', 'export', chartTitle);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('SVG export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy PNG to Clipboard
  const handleCopyClipboard = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, backgroundColor: '#090d16' });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
      trackEvent('copy_clipboard', 'export', chartTitle);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Clipboard copy failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Embed iFrame
  const embedSnippet = `<iframe src="https://chartgenie.xyz/embed/${sanitizeFilename(chartTitle)}" width="100%" height="450" frameborder="0" loading="lazy"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    trackEvent('copy_embed_code', 'export', chartTitle);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '520px', padding: '24px', position: 'relative' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Sparkles size={22} color="#38bdf8" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Export Publication Chart</h3>
        </div>

        {/* Export Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Retina PNG 2x */}
          <button
            onClick={() => handleDownloadPng(2)}
            disabled={isExporting}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> High-Res PNG (Retina 2x)
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase' }}>Recommended</span>
          </button>

          {/* Vector SVG */}
          <button
            onClick={handleDownloadSvg}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Scalable Vector SVG
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>For Figma / Illustrator</span>
          </button>

          {/* Copy Image */}
          <button
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {copiedImage ? <Check size={18} color="#10b981" /> : <Copy size={18} />} Copy to Clipboard
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Paste into Slides/Word</span>
          </button>

          {/* Print 4K PNG */}
          <button
            onClick={() => handleDownloadPng(4)}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Ultra 4K PNG (Print 300 DPI)
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>For PDFs & Reports</span>
          </button>
        </div>

        {/* Embed Code Snippet */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            Interactive iFrame Web Embed
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <input
              type="text"
              readOnly
              value={embedSnippet}
              className="input-glass"
              style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
            />
            <button
              onClick={handleCopyEmbed}
              className="btn-secondary"
              style={{ whiteSpace: 'nowrap' }}
            >
              {copiedCode ? <Check size={16} color="#10b981" /> : <Code size={16} />} Copy Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
