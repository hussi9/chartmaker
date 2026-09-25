import React, { useState } from 'react';
import { X, Download, Copy, Code, Check, Sparkles, Share2, FileSpreadsheet, FileJson } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import confetti from 'canvas-confetti';
import { trackEvent, trackExportChart } from '../lib/gtag';
import { triggerHaptic } from '../lib/haptics';
import type { DataItem } from '../lib/chartPresets';
import Papa from 'papaparse';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  chartTitle: string;
  data?: DataItem[];
  onNotify?: (text: string, type?: 'success' | 'info' | 'viral') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  chartTitle,
  data,
  onNotify
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const sanitizeFilename = (title: string) => {
    return (title || 'chartgenie-export')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Native Web Share API (Works on Mobile iOS/Android & supported desktops)
  const handleNativeShare = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    triggerHaptic('light');

    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, backgroundColor: '#090d16' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${sanitizeFilename(chartTitle)}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: chartTitle || 'My Chart',
          text: `Check out this chart "${chartTitle || 'My Chart'}" created with ChartGenie!`,
          url: window.location.href
        });
        trackEvent('native_share', 'viral_share', chartTitle);
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
        onNotify?.('Shared successfully!', 'viral');
      } else if (navigator.share) {
        await navigator.share({
          title: chartTitle || 'My Chart',
          text: `Check out this chart "${chartTitle || 'My Chart'}" created with ChartGenie!`,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await handleCopyClipboard();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed', err);
        await handleCopyClipboard();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Share to X (Twitter)
  const handleShareToTwitter = () => {
    triggerHaptic('light');
    const text = encodeURIComponent(`📊 ${chartTitle || 'Visual Chart'}\nCreated with ChartGenie.xyz #dataviz #infographics`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    trackEvent('share_twitter', 'viral_share', chartTitle);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  // Export PNG
  const handleDownloadPng = async (pixelRatio: number) => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    triggerHaptic('light');

    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio, backgroundColor: '#090d16' });
      const link = document.createElement('a');
      link.download = `${sanitizeFilename(chartTitle)}-${pixelRatio}x.png`;
      link.href = dataUrl;
      link.click();

      trackEvent('export_png', 'export', chartTitle, pixelRatio);
      trackExportChart('png', pixelRatio);
      triggerHaptic('success');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onNotify?.(`Downloaded ${pixelRatio === 4 ? '4K Ultra' : 'Retina 2x'} PNG!`, 'success');
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
    triggerHaptic('light');

    try {
      const dataUrl = await toSvg(canvasRef.current, { backgroundColor: '#090d16' });
      const link = document.createElement('a');
      link.download = `${sanitizeFilename(chartTitle)}.svg`;
      link.href = dataUrl;
      link.click();

      trackEvent('export_svg', 'export', chartTitle);
      trackExportChart('svg');
      triggerHaptic('success');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onNotify?.('Downloaded Vector SVG!', 'success');
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
    triggerHaptic('light');

    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, backgroundColor: '#090d16' });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
      trackEvent('copy_clipboard', 'export', chartTitle);
      trackExportChart('png', 2);
      triggerHaptic('success');
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      onNotify?.('Chart copied to clipboard! Paste anywhere (Cmd+V)', 'viral');
    } catch (err) {
      console.error('Clipboard copy failed', err);
      onNotify?.('Clipboard copy failed. Try downloading PNG instead.', 'info');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy SVG Vector to Clipboard (Direct paste into Figma / Illustrator)
  const handleCopySvgCode = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    triggerHaptic('light');

    try {
      const dataUrl = await toSvg(canvasRef.current, { backgroundColor: '#090d16' });
      const svgCode = decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''));
      await navigator.clipboard.writeText(svgCode);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
      trackEvent('copy_svg_code', 'export', chartTitle);
      triggerHaptic('success');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onNotify?.('SVG vector code copied! Paste directly into Figma (Cmd+V)', 'viral');
    } catch (err) {
      console.error('SVG copy failed', err);
      onNotify?.('SVG copy failed', 'info');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Embed iFrame
  const embedSnippet = `<iframe src="https://chartgenie.xyz/embed/${sanitizeFilename(chartTitle)}" width="100%" height="450" frameborder="0" loading="lazy"></iframe>`;

  const handleCopyEmbed = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(embedSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    trackEvent('copy_embed_code', 'export', chartTitle);
    onNotify?.('Embed iframe snippet copied!', 'success');
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (!data || data.length === 0) return;
    triggerHaptic('light');
    const csvString = Papa.unparse(data.map((item) => ({ Label: item.name, Value: item.value })));
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(chartTitle)}.csv`;
    link.click();
    trackEvent('export_csv', 'export', chartTitle);
    onNotify?.('Downloaded data as CSV!', 'success');
  };

  // Download JSON
  const handleDownloadJson = () => {
    if (!data || data.length === 0) return;
    triggerHaptic('light');
    const jsonString = JSON.stringify(data.map(item => ({ label: item.name, value: item.value })), null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(chartTitle)}.json`;
    link.click();
    trackEvent('export_json', 'export', chartTitle);
    onNotify?.('Downloaded data as JSON!', 'success');
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

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
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade" style={{ width: '100%', maxWidth: '520px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Export & Viral Share</h3>
        </div>

        {/* Viral Share Actions */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              disabled={isExporting}
              className="btn-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.35)'
              }}
            >
              <Share2 size={16} /> Native Share Sheet
            </button>
          )}

          <button
            onClick={handleShareToTwitter}
            className="btn-secondary"
            style={{
              flex: hasNativeShare ? 1 : 2,
              justifyContent: 'center',
              padding: '12px',
              borderColor: 'rgba(29, 155, 240, 0.4)',
              color: '#38bdf8'
            }}
          >
            Post to X (Twitter)
          </button>
        </div>

        {/* Export Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

          {/* Copy Image */}
          <button
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {copiedImage ? <Check size={18} color="#10b981" /> : <Copy size={18} />} Copy Image to Clipboard
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Paste into Slides/Slack</span>
          </button>

          {/* Copy Vector SVG for Figma */}
          <button
            onClick={handleCopySvgCode}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#d8b4fe' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {copiedSvg ? <Check size={18} color="#10b981" /> : <Sparkles size={18} color="#c084fc" />} Copy Vector SVG for Figma
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>1-Click Paste (Cmd+V)</span>
          </button>

          {/* Vector SVG Download */}
          <button
            onClick={handleDownloadSvg}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Download Vector SVG (.svg)
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Illustrator / Code</span>
          </button>

          {/* Print 4K PNG */}
          <button
            onClick={() => handleDownloadPng(4)}
            disabled={isExporting}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between', padding: '12px 18px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Ultra 4K PNG (300 DPI)
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Print / Whitepaper</span>
          </button>

          {/* Download CSV */}
          {data && data.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={handleDownloadCsv}
                disabled={isExporting}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: '0.82rem' }}
              >
                <FileSpreadsheet size={16} color="#10b981" /> Download CSV (.csv)
              </button>
              <button
                onClick={handleDownloadJson}
                disabled={isExporting}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: '0.82rem' }}
              >
                <FileJson size={16} color="#f59e0b" /> Download JSON (.json)
              </button>
            </div>
          )}
        </div>

        {/* Embed Code Snippet */}
        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
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
              {copiedCode ? <Check size={16} color="#10b981" /> : <Code size={16} />} Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
