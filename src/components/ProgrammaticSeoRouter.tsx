import type { ChartType } from '../lib/chartPresets';
import { Route, Sparkles } from 'lucide-react';

interface ProgrammaticSeoRouterProps {
  onSelectRoute: (type: ChartType, title: string, subtitle: string) => void;
}

export const ProgrammaticSeoRouter: React.FC<ProgrammaticSeoRouterProps> = ({ onSelectRoute }) => {
  const routes = [
    {
      path: '/pie-chart-maker',
      label: 'Pie Chart Maker',
      type: 'pie' as ChartType,
      title: 'Free Online Pie Chart Generator',
      subtitle: 'Create & export customizable pie charts in seconds'
    },
    {
      path: '/bar-graph-maker',
      label: 'Bar Graph Generator',
      type: 'bar' as ChartType,
      title: 'Online Bar Graph Maker',
      subtitle: 'Convert spreadsheet data into publication-ready bar charts'
    },
    {
      path: '/line-graph-maker',
      label: 'Line Graph Maker',
      type: 'line' as ChartType,
      title: 'Free Line Graph Generator',
      subtitle: 'Plot trend curves and time-series data with smooth lines'
    },
    {
      path: '/donut-chart-maker',
      label: 'Donut Chart Generator',
      type: 'donut' as ChartType,
      title: 'Online Donut Chart Builder',
      subtitle: 'Design modern ring donut charts with custom center metrics'
    },
    {
      path: '/radar-chart-maker',
      label: 'Radar Chart Builder',
      type: 'radar' as ChartType,
      title: 'Radar & Spider Chart Generator',
      subtitle: 'Visualize multi-variable performance metrics on a radar grid'
    },
    {
      path: '/convert-excel-to-chart',
      label: 'Excel to Chart Converter',
      type: 'horizontalBar' as ChartType,
      title: 'Convert Excel & CSV Data to Charts',
      subtitle: 'Paste raw spreadsheet rows to render high-res vector graphics'
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Route size={16} color="#38bdf8" />
        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Programmatic Micro-Tools & Landing Views
        </span>
        <Sparkles size={14} color="#a855f7" />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {routes.map((r) => (
          <button
            key={r.path}
            onClick={() => onSelectRoute(r.type, r.title, r.subtitle)}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'var(--border-glass)'
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};
