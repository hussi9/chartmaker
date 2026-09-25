import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { ChartTypeBar } from './components/ChartTypeBar';
import { ChartCanvas } from './components/ChartCanvas';
import { ExportModal } from './components/ExportModal';
import { TemplateGallery } from './components/TemplateGallery';
import { SavedChartsModal } from './components/SavedChartsModal';
import { AiPromptModal } from './components/AiPromptModal';
import { SeoAeoSection } from './components/SeoAeoSection';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { COLOR_SCHEMES } from './lib/chartPresets';
import { decodeChartState, encodeChartState } from './lib/urlState';
import { getSavedCharts, saveChartToLibrary, deleteChartFromLibrary, saveAutosave, loadAutosave } from './lib/storage';
import { decorateItemWithEmoji } from './lib/emojiDecorator';
import { triggerHaptic } from './lib/haptics';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import type { DataItem, ChartType, ColorScheme, AspectRatio, FontFamily, CanvasThemeMode } from './lib/chartPresets';
import type { SavedChart } from './lib/storage';
import {
  initGoogleAnalytics,
  trackChartCreate,
  trackCopyChart,
  trackAiPromptGenerate,
  trackThemeSelection,
  trackAspectRatioSelection
} from './lib/gtag';

export function App() {
  // Initialize state once from URL Hash or Autosave or default
  const getInitialState = () => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('state=')) {
      const hashPart = window.location.hash.split('state=')[1];
      const decoded = decodeChartState(hashPart);
      if (decoded) {
        const matched = COLOR_SCHEMES.find(s => s.id === decoded.schemeId) || COLOR_SCHEMES[0];
        return {
          data: decoded.data,
          title: decoded.title,
          subtitle: decoded.subtitle,
          chartType: decoded.chartType,
          activeScheme: matched,
          aspectRatio: '16:9' as AspectRatio,
          fontFamily: 'Plus Jakarta Sans' as FontFamily,
          bgMode: 'light' as CanvasThemeMode,
          creatorHandle: '',
          calloutMetric: '',
          showLegend: false,
          showValues: true,
          is3d: false,
          showWatermark: true,
          showGrid: true,
          fontSize: 'medium' as const
        };
      }
    }

    const savedAuto = loadAutosave();
    if (savedAuto && savedAuto.data && savedAuto.data.length > 0 && !(typeof window !== 'undefined' && window.location.pathname && window.location.pathname.length > 1)) {
      const matched = COLOR_SCHEMES.find(s => s.id === savedAuto.schemeId) || COLOR_SCHEMES[0];
      return {
        data: savedAuto.data,
        title: savedAuto.title || 'Countries',
        subtitle: savedAuto.subtitle || '',
        chartType: savedAuto.chartType || 'line',
        activeScheme: matched,
        aspectRatio: savedAuto.aspectRatio || '16:9',
        fontFamily: savedAuto.fontFamily || 'Plus Jakarta Sans',
        bgMode: (savedAuto.bgMode as CanvasThemeMode) || 'light',
        creatorHandle: savedAuto.creatorHandle || '',
        calloutMetric: savedAuto.calloutMetric || '',
        showLegend: savedAuto.showLegend ?? false,
        showValues: savedAuto.showValues ?? true,
        is3d: savedAuto.is3d ?? false,
        showWatermark: true,
        showGrid: true,
        fontSize: 'medium' as const
      };
    }

    // Check Sub-Route URL Path
    if (typeof window !== 'undefined' && window.location.pathname) {
      const p = window.location.pathname;
      if (p.includes('pie-chart-maker')) {
        return {
          data: [
            { id: '1', name: 'Chrome', value: 65 },
            { id: '2', name: 'Safari', value: 20 },
            { id: '3', name: 'Edge', value: 10 },
            { id: '4', name: 'Others', value: 5 }
          ],
          title: 'Browser Market Share',
          subtitle: 'Global Desktop Usage 2026',
          chartType: 'pie' as ChartType,
          activeScheme: COLOR_SCHEMES.find(s => s.id === 'apple') || COLOR_SCHEMES[0],
          aspectRatio: '16:9' as AspectRatio,
          fontFamily: 'Plus Jakarta Sans' as FontFamily,
          bgMode: 'light' as CanvasThemeMode,
          creatorHandle: '',
          calloutMetric: '💡 Chrome leads at 65%',
          showLegend: true,
          showValues: true,
          is3d: false,
          showWatermark: true,
          showGrid: true,
          fontSize: 'medium' as const
        };
      }
      if (p.includes('bar-graph-maker')) {
        return {
          data: [
            { id: '1', name: 'Q1 Sales', value: 120 },
            { id: '2', name: 'Q2 Sales', value: 250 },
            { id: '3', name: 'Q3 Sales', value: 410 },
            { id: '4', name: 'Q4 Target', value: 680 }
          ],
          title: 'Quarterly Revenue Performance',
          subtitle: 'USD Millions (2026)',
          chartType: 'bar' as ChartType,
          activeScheme: COLOR_SCHEMES.find(s => s.id === 'linear') || COLOR_SCHEMES[0],
          aspectRatio: '16:9' as AspectRatio,
          fontFamily: 'Plus Jakarta Sans' as FontFamily,
          bgMode: 'light' as CanvasThemeMode,
          creatorHandle: '',
          calloutMetric: '💡 Q4 target is 680M (+65%)',
          showLegend: false,
          showValues: true,
          is3d: false,
          showWatermark: true,
          showGrid: true,
          fontSize: 'medium' as const
        };
      }
      if (p.includes('donut-chart-maker')) {
        return {
          data: [
            { id: '1', name: 'Stocks (US)', value: 55 },
            { id: '2', name: 'Real Estate', value: 25 },
            { id: '3', name: 'Crypto & Gold', value: 15 },
            { id: '4', name: 'Cash', value: 5 }
          ],
          title: 'Asset Allocation Portfolio',
          subtitle: 'Balanced Growth Strategy',
          chartType: 'donut' as ChartType,
          activeScheme: COLOR_SCHEMES.find(s => s.id === 'emerald') || COLOR_SCHEMES[0],
          aspectRatio: '1:1' as AspectRatio,
          fontFamily: 'Plus Jakarta Sans' as FontFamily,
          bgMode: 'light' as CanvasThemeMode,
          creatorHandle: '',
          calloutMetric: '💡 Equity allocation: 55%',
          showLegend: true,
          showValues: true,
          is3d: false,
          showWatermark: true,
          showGrid: true,
          fontSize: 'medium' as const
        };
      }
      if (p.includes('radar-chart-maker')) {
        return {
          data: [
            { id: '1', name: 'Frontend', value: 95 },
            { id: '2', name: 'Backend', value: 88 },
            { id: '3', name: 'UI/UX Design', value: 92 },
            { id: '4', name: 'DevOps', value: 82 },
            { id: '5', name: 'SEO & GEO', value: 98 }
          ],
          title: 'Engineering Competency Radar',
          subtitle: 'Full-Stack Performance Evaluation',
          chartType: 'radar' as ChartType,
          activeScheme: COLOR_SCHEMES.find(s => s.id === 'midnight') || COLOR_SCHEMES[0],
          aspectRatio: '1:1' as AspectRatio,
          fontFamily: 'Plus Jakarta Sans' as FontFamily,
          bgMode: 'dark' as CanvasThemeMode,
          creatorHandle: '',
          calloutMetric: '💡 Overall score: 91/100',
          showLegend: false,
          showValues: true,
          is3d: false,
          showWatermark: true,
          showGrid: true,
          fontSize: 'medium' as const
        };
      }
      if (p.includes('convert-excel-to-chart')) {
        return {
          data: [
            { id: '1', name: 'Engineering', value: 450 },
            { id: '2', name: 'Marketing', value: 280 },
            { id: '3', name: 'Sales & BD', value: 310 },
            { id: '4', name: 'Operations', value: 160 }
          ],
          title: 'Spreadsheet Budget Breakdown',
          subtitle: 'Converted from Excel / CSV',
          chartType: 'horizontalBar' as ChartType,
          activeScheme: COLOR_SCHEMES.find(s => s.id === 'cyberpunk') || COLOR_SCHEMES[0],
          aspectRatio: '16:9' as AspectRatio,
          fontFamily: 'Plus Jakarta Sans' as FontFamily,
          bgMode: 'light' as CanvasThemeMode,
          creatorHandle: '',
          calloutMetric: '💡 R&D allocation leads',
          showLegend: false,
          showValues: true,
          is3d: false,
          showWatermark: true,
          showGrid: true,
          fontSize: 'medium' as const
        };
      }
    }

    // Default Countries Line Chart matching the reference layout
    return {
      data: [
        { id: '1', name: 'USA', value: 50 },
        { id: '2', name: 'Italy', value: 16 },
        { id: '3', name: 'UK', value: 15 },
        { id: '4', name: 'Ireland', value: 19 }
      ],
      title: 'Countries',
      subtitle: '',
      chartType: 'line' as ChartType,
      activeScheme: COLOR_SCHEMES.find(s => s.id === 'apple') || COLOR_SCHEMES[0],
      aspectRatio: '16:9' as AspectRatio,
      fontFamily: 'Plus Jakarta Sans' as FontFamily,
      bgMode: 'light' as CanvasThemeMode,
      creatorHandle: '',
      calloutMetric: '',
      showLegend: false,
      showValues: true,
      is3d: false,
      showWatermark: true,
      showGrid: true,
      fontSize: 'medium' as const,
      dataSource: '',
      showAverageLine: false
    };
  };

  const initial = getInitialState();

  // Application State
  const [data, setData] = useState<DataItem[]>(initial.data);
  const [title, setTitle] = useState<string>(initial.title);
  const [subtitle, setSubtitle] = useState<string>(initial.subtitle);
  const [calloutMetric, setCalloutMetric] = useState<string>(initial.calloutMetric || '');
  const [dataSource, setDataSource] = useState<string>((initial as any).dataSource || '');
  const [showAverageLine, setShowAverageLine] = useState<boolean>((initial as any).showAverageLine || false);
  const [chartType, setChartType] = useState<ChartType>(initial.chartType);
  const [activeScheme, setActiveScheme] = useState<ColorScheme>(initial.activeScheme);
  const [showLegend, setShowLegend] = useState<boolean>(initial.showLegend);
  const [showValues, setShowValues] = useState<boolean>(initial.showValues);
  const [showGrid, setShowGrid] = useState<boolean>(initial.showGrid);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(initial.fontSize);
  const [is3d, setIs3d] = useState<boolean>(initial.is3d);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initial.aspectRatio);
  const [fontFamily, setFontFamily] = useState<FontFamily>(initial.fontFamily);
  const [bgMode, setBgMode] = useState<CanvasThemeMode>(initial.bgMode);
  const [creatorHandle, setCreatorHandle] = useState<string>(initial.creatorHandle);
  const [showWatermark, setShowWatermark] = useState<boolean>(initial.showWatermark);

  // Active Control Panel Tab ('content' vs 'style' vs 'settings')
  const [activeControlTab, setActiveControlTab] = useState<'content' | 'style' | 'settings'>('content');

  // Modals & Storage
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isSavedOpen, setIsSavedOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>(() => getSavedCharts());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showFirstTimeWelcome, setShowFirstTimeWelcome] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !localStorage.getItem('cg_welcomed_v1');
    } catch {
      return false;
    }
  });

  const dismissWelcome = () => {
    setShowFirstTimeWelcome(false);
    try {
      localStorage.setItem('cg_welcomed_v1', 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Toast notification helper
  const addToast = useCallback((text: string, type: 'success' | 'info' | 'viral' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  // Initialize GA4
  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  // Autosave current work
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAutosave({
        title,
        subtitle,
        calloutMetric,
        dataSource,
        showAverageLine,
        chartType,
        schemeId: activeScheme.id,
        aspectRatio,
        fontFamily,
        bgMode,
        showLegend,
        showValues,
        is3d,
        creatorHandle,
        data
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [title, subtitle, calloutMetric, dataSource, showAverageLine, chartType, activeScheme, aspectRatio, fontFamily, bgMode, showLegend, showValues, is3d, creatorHandle, data]);

  // Save current chart to local library
  const handleQuickSave = useCallback(() => {
    const saved = saveChartToLibrary({
      title: title || 'Untitled Chart',
      subtitle,
      calloutMetric,
      dataSource,
      showAverageLine,
      chartType,
      schemeId: activeScheme.id,
      aspectRatio,
      fontFamily,
      bgMode,
      showLegend,
      showValues,
      is3d,
      creatorHandle,
      data
    });
    setSavedCharts(getSavedCharts());
    triggerHaptic('success');
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    addToast(`"${saved.title}" saved to My Charts!`, 'success');
  }, [title, subtitle, calloutMetric, dataSource, showAverageLine, chartType, activeScheme, aspectRatio, fontFamily, bgMode, showLegend, showValues, is3d, creatorHandle, data, addToast]);

  // Keyboard shortcuts (Cmd+S / Ctrl+S to save, Cmd+E / Ctrl+E to export)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleQuickSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickSave]);

  // Delete chart from library
  const handleDeleteSavedChart = (id: string) => {
    const updated = deleteChartFromLibrary(id);
    setSavedCharts(updated);
    addToast('Chart removed from library', 'info');
  };

  // Load chart from library
  const handleLoadSavedChart = (chart: SavedChart) => {
    setTitle(chart.title);
    setSubtitle(chart.subtitle);
    setChartType(chart.chartType);
    setData(chart.data);
    if (chart.dataSource !== undefined) setDataSource(chart.dataSource);
    if (chart.showAverageLine !== undefined) setShowAverageLine(chart.showAverageLine);
    const matched = COLOR_SCHEMES.find(s => s.id === chart.schemeId);
    if (matched) setActiveScheme(matched);
    if (chart.aspectRatio) setAspectRatio(chart.aspectRatio);
    if (chart.fontFamily) setFontFamily(chart.fontFamily);
    if (chart.bgMode) setBgMode(chart.bgMode);
    if (chart.creatorHandle !== undefined) setCreatorHandle(chart.creatorHandle);
    if (chart.calloutMetric !== undefined) setCalloutMetric(chart.calloutMetric);
    if (chart.showLegend !== undefined) setShowLegend(chart.showLegend);
    if (chart.showValues !== undefined) setShowValues(chart.showValues);
    if (chart.is3d !== undefined) setIs3d(chart.is3d);
    addToast(`Loaded "${chart.title}"`, 'success');
  };

  // Handle preset selection from Template Gallery
  const handleSelectTemplate = (newData: DataItem[], newTitle: string, newSubtitle: string, newType: ChartType) => {
    setData(newData);
    setTitle(newTitle);
    setSubtitle(newSubtitle);
    setChartType(newType);
    addToast(`Loaded ${newTitle}`, 'viral');
  };

  // Auto-Emoji Decorator
  const handleAutoEmoji = () => {
    triggerHaptic('medium');
    const decorated = data.map(item => ({
      ...item,
      name: decorateItemWithEmoji(item.name)
    }));
    setData(decorated);
    addToast('✨ Added viral emojis to data labels!', 'viral');
  };

  // Direct copy PNG from canvas
  const handleDirectCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { pixelRatio: 2, backgroundColor: bgMode === 'light' ? '#ffffff' : '#090d16' });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      trackCopyChart();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      addToast('Chart copied to clipboard! (Ready to paste)', 'viral');
    } catch {
      setIsExportOpen(true);
    }
  };

  // Tracked selection handlers
  const handleSelectScheme = (scheme: ColorScheme) => {
    setActiveScheme(scheme);
    trackThemeSelection(scheme.id);
  };

  const handleSelectAspectRatio = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    trackAspectRatioSelection(ratio);
  };

  const handleSelectChartType = (type: ChartType) => {
    setChartType(type);
    if (type === 'threshold') {
      setShowAverageLine(true);
    }
    trackChartCreate(type, activeScheme.id, aspectRatio, data.length);
  };

  // Get share link
  const handleShareLink = () => {
    triggerHaptic('light');
    const encoded = encodeChartState({
      title,
      subtitle,
      chartType,
      schemeId: activeScheme.id,
      dataSource,
      showAverageLine,
      data
    });
    if (encoded) {
      const shareUrl = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
      navigator.clipboard.writeText(shareUrl);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.7 } });
      addToast('🔗 Live interactive link copied! Anyone can view your chart.', 'viral');
    }
  };

  // Apply AI prompt result
  const handleApplyAiPrompt = (res: { data: DataItem[]; title: string; subtitle: string; chartType?: ChartType }) => {
    if (res.data.length > 0) setData(res.data);
    if (res.title) setTitle(res.title);
    if (res.subtitle) setSubtitle(res.subtitle);
    if (res.chartType) setChartType(res.chartType);
    trackAiPromptGenerate(res.title || 'AI Chart', true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
    addToast('✨ Chart generated with AI!', 'viral');
  };

  return (
    <div className="single-screen-app">
      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />

      {/* Slim Modern Header Bar */}
      <Header
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAiPrompt={() => setIsAiModalOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onQuickSave={handleQuickSave}
        savedCount={savedCharts.length}
        chartState={{
          title,
          subtitle,
          chartType,
          schemeId: activeScheme.id,
          data
        }}
        onNotify={addToast}
      />

      {/* Playful Minimalist First-Time Greeting */}
      {showFirstTimeWelcome && (
        <aside
          role="status"
          aria-label="Welcome greeting"
          className="welcome-banner animate-fade"
          style={{
            margin: '-6px auto 16px auto',
            maxWidth: '1240px',
            background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(240, 253, 250, 0.95))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: '0 4px 18px -2px rgba(99, 102, 241, 0.12)',
            borderRadius: '14px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#1e293b' }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>✨</span>
            <span>
              <strong>Welcome!</strong> No signups, 100% free. Edit any number on the left or tap <strong>AI Prompt</strong> to create publication-ready charts in seconds.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                dismissWelcome();
                setIsAiModalOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🪄 Try AI Prompt</span>
            </button>
            <button
              onClick={dismissWelcome}
              title="Dismiss"
              style={{
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.8rem',
                color: '#64748b',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ✕ Got it
            </button>
          </div>
        </aside>
      )}

      {/* Single Screen Dashboard Layout */}
      <main className="single-screen-main">
        {/* Left Column: Control Panel Card */}
        <ControlPanel
          activeTab={activeControlTab}
          onChangeTab={setActiveControlTab}
          title={title}
          onChangeTitle={setTitle}
          subtitle={subtitle}
          onChangeSubtitle={setSubtitle}
          dataSource={dataSource}
          onChangeDataSource={setDataSource}
          data={data}
          onChangeData={setData}
          onOpenAiPrompt={() => setIsAiModalOpen(true)}
          onAutoEmoji={handleAutoEmoji}
          onNotify={addToast}
          activeScheme={activeScheme}
          onSelectScheme={handleSelectScheme}
          fontFamily={fontFamily}
          onChangeFontFamily={setFontFamily}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          showLabels={showValues}
          onToggleLabels={() => setShowValues(!showValues)}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(!showLegend)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showAverageLine={showAverageLine}
          onToggleAverageLine={() => setShowAverageLine(!showAverageLine)}
          is3d={is3d}
          onToggle3d={() => setIs3d(!is3d)}
          showWatermark={showWatermark}
          onToggleWatermark={() => setShowWatermark(!showWatermark)}
          creatorHandle={creatorHandle}
          onChangeCreatorHandle={setCreatorHandle}
          calloutMetric={calloutMetric}
          onChangeCalloutMetric={setCalloutMetric}
          bgMode={bgMode}
          onChangeBgMode={setBgMode}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={handleSelectAspectRatio}
        />

        {/* Right Column: Chart Type Bar + Main Chart Card */}
        <section className="chart-stage-container">
          {/* Top Chart Type Selector Cards */}
          <ChartTypeBar
            activeType={chartType}
            onSelectType={handleSelectChartType}
          />

          {/* Main Chart Card */}
          <div className="main-chart-display-card">
            <ChartCanvas
              data={data}
              chartType={chartType}
              scheme={activeScheme}
              title={title}
              subtitle={subtitle}
              calloutMetric={calloutMetric}
              dataSource={dataSource}
              showLegend={showLegend}
              showValues={showValues}
              showAverageLine={showAverageLine}
              is3d={is3d}
              onToggle3d={() => setIs3d(!is3d)}
              aspectRatio={aspectRatio}
              onChangeAspectRatio={handleSelectAspectRatio}
              fontFamily={fontFamily}
              bgMode={bgMode}
              creatorHandle={creatorHandle}
              showWatermark={showWatermark}
              canvasRef={canvasRef}
              onCopyImage={handleDirectCopyImage}
              fontSize={fontSize}
              showGrid={showGrid}
              onGetShareLink={handleShareLink}
              onDownload={() => setIsExportOpen(true)}
            />
          </div>
        </section>
      </main>

      {/* AI Prompt Modal */}
      <AiPromptModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyPrompt={handleApplyAiPrompt}
      />

      {/* Export / Share Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvasRef={canvasRef}
        chartTitle={title}
        subtitle={subtitle}
        calloutMetric={calloutMetric}
        dataSource={dataSource}
        data={data}
        onNotify={addToast}
      />

      {/* Templates Modal */}
      <TemplateGallery
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Saved Charts Library Modal */}
      <SavedChartsModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        savedCharts={savedCharts}
        onLoadChart={handleLoadSavedChart}
        onDeleteChart={handleDeleteSavedChart}
        onSaveCurrentAsNew={handleQuickSave}
        onNotify={addToast}
      />

      {/* SEO & Knowledge Section below the fold */}
      <section style={{ maxWidth: '1440px', margin: '40px auto 20px', padding: '0 20px' }}>
        <SeoAeoSection />
      </section>
    </div>
  );
}

export default App;
