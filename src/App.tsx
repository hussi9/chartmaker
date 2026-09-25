import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { OmniImporter } from './components/OmniImporter';
import { CustomizerDrawer } from './components/CustomizerDrawer';
import { ChartCanvas } from './components/ChartCanvas';
import { ExportModal } from './components/ExportModal';
import { SeoSection } from './components/SeoSection';
import { COLOR_SCHEMES, SAMPLE_DATASETS } from './lib/chartPresets';
import type { DataItem, ChartType, ColorScheme } from './lib/chartPresets';

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
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Handle preset switching
  const handleSelectPreset = (key: keyof typeof SAMPLE_DATASETS) => {
    const preset = SAMPLE_DATASETS[key];
    setData(preset.data);
    setTitle(preset.title);
    setSubtitle(preset.subtitle);

    if (key === 'revenueGrowth') {
      setChartType('bar');
    } else if (key === 'trafficSources') {
      setChartType('horizontalBar');
    } else {
      setChartType('pie');
    }
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
            canvasRef={canvasRef}
          />
        </section>
      </main>

      {/* Programmatic SEO & FAQ Section */}
      <SeoSection />

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
