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
    if (savedAuto && savedAuto.data && savedAuto.data.length > 0) {
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
      fontSize: 'medium' as const
    };
  };

  const initial = getInitialState();

  // Application State
  const [data, setData] = useState<DataItem[]>(initial.data);
  const [title, setTitle] = useState<string>(initial.title);
  const [subtitle, setSubtitle] = useState<string>(initial.subtitle);
  const [calloutMetric, setCalloutMetric] = useState<string>(initial.calloutMetric || '');
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
  }, [title, subtitle, calloutMetric, chartType, activeScheme, aspectRatio, fontFamily, bgMode, showLegend, showValues, is3d, creatorHandle, data]);

  // Save current chart to local library
  const handleQuickSave = useCallback(() => {
    const saved = saveChartToLibrary({
      title: title || 'Untitled Chart',
      subtitle,
      calloutMetric,
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
  }, [title, subtitle, calloutMetric, chartType, activeScheme, aspectRatio, fontFamily, bgMode, showLegend, showValues, is3d, creatorHandle, data, addToast]);

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
              showLegend={showLegend}
              showValues={showValues}
              is3d={is3d}
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
      />

      {/* SEO & Knowledge Section below the fold */}
      <section style={{ maxWidth: '1440px', margin: '40px auto 20px', padding: '0 20px' }}>
        <SeoAeoSection />
      </section>
    </div>
  );
}

export default App;
