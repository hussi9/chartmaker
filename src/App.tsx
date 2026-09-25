import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { OmniImporter } from './components/OmniImporter';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { ChartCanvas } from './components/ChartCanvas';
import { ExportModal } from './components/ExportModal';
import { ProgrammaticSeoRouter } from './components/ProgrammaticSeoRouter';
import { SeoAeoSection } from './components/SeoAeoSection';
import { COLOR_SCHEMES, SAMPLE_DATASETS } from './lib/chartPresets';
import type { DataItem, ChartType, ColorScheme, AspectRatio, FontFamily } from './lib/chartPresets';

export function App() {
  // Application State
  const [data, setData] = useState<DataItem[]>(SAMPLE_DATASETS.marketShare.data);
  const [title, setTitle] = useState<string>(SAMPLE_DATASETS.marketShare.title);
  const [subtitle, setSubtitle] = useState<string>(SAMPLE_DATASETS.marketShare.subtitle);
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [activeScheme, setActiveScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showValues, setShowValues] = useState<boolean>(true);
  const [is3d, setIs3d] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [fontFamily, setFontFamily] = useState<FontFamily>('Plus Jakarta Sans');
  const [bgMode, setBgMode] = useState<'dark' | 'pure-dark' | 'slate' | 'light'>('dark');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Handle preset switching
  const handleSelectPreset = (key: keyof typeof SAMPLE_DATASETS) => {
    const preset = SAMPLE_DATASETS[key];
    setData(preset.data);
    setTitle(preset.title);
    setSubtitle(preset.subtitle);

    if (key === 'revenueGrowth' || key === 'marketingFunnel') {
      setChartType('bar');
    } else if (key === 'trafficSources') {
      setChartType('horizontalBar');
    } else if (key === 'skillRadar') {
      setChartType('radar');
    } else {
      setChartType('pie');
    }
  };

  // Handle Programmatic Route Click
  const handleSelectRoute = (type: ChartType, newTitle: string, newSubtitle: string) => {
    setChartType(type);
    setTitle(newTitle);
    setSubtitle(newSubtitle);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        onSelectPreset={handleSelectPreset}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAiPrompt={() => {
          const el = document.getElementById('omni-importer-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Programmatic SEO Router Pills */}
      <ProgrammaticSeoRouter onSelectRoute={handleSelectRoute} />

      {/* Main Responsive Grid */}
      <main className="main-grid">
        {/* Sidebar Controls */}
        <aside style={{ display: 'flex', flexDirection: 'column' }}>
          <div id="omni-importer-section">
            <OmniImporter
              data={data}
              onChangeData={setData}
              title={title}
              onChangeTitle={setTitle}
              subtitle={subtitle}
              onChangeSubtitle={setSubtitle}
            />
          </div>

          <CustomizerDrawer
            chartType={chartType}
            onChangeChartType={setChartType}
            activeScheme={activeScheme}
            onChangeScheme={setActiveScheme}
            showLegend={showLegend}
            onToggleLegend={setShowLegend}
            showValues={showValues}
            onToggleValues={setShowValues}
            is3d={is3d}
            onToggle3d={setIs3d}
            aspectRatio={aspectRatio}
            onChangeAspectRatio={setAspectRatio}
            fontFamily={fontFamily}
            onChangeFontFamily={setFontFamily}
            bgMode={bgMode}
            onChangeBgMode={setBgMode}
          />
        </aside>

        {/* Live Visual Canvas Area */}
        <section style={{ display: 'flex', flexDirection: 'column' }}>
          <ChartCanvas
            data={data}
            chartType={chartType}
            scheme={activeScheme}
            title={title}
            subtitle={subtitle}
            showLegend={showLegend}
            showValues={showValues}
            is3d={is3d}
            aspectRatio={aspectRatio}
            fontFamily={fontFamily}
            bgMode={bgMode}
            canvasRef={canvasRef}
          />
        </section>
      </main>

      {/* Answer Engine & Programmatic SEO Section */}
      <SeoAeoSection />

      {/* Export & Embed Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvasRef={canvasRef}
        chartTitle={title}
      />
    </div>
  );
}

export default App;
