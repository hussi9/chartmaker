import { useState } from 'react';
import { Clipboard, Plus, Trash2, Wand2, FileSpreadsheet, Download } from 'lucide-react';
import type { DataItem } from '../lib/chartPresets';
import Papa from 'papaparse';

interface OmniImporterProps {
  data: DataItem[];
  onChangeData: (newData: DataItem[]) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  subtitle: string;
  onChangeSubtitle: (subtitle: string) => void;
}

export const OmniImporter: React.FC<OmniImporterProps> = ({
  data,
  onChangeData,
  title,
  onChangeTitle,
  subtitle,
  onChangeSubtitle
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'paste' | 'ai'>('table');
  const [pasteContent, setPasteContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Handle cell edit
  const handleUpdateItem = (id: string, field: 'name' | 'value', val: string) => {
    const updated = data.map((item) => {
      if (item.id === id) {
        if (field === 'value') {
          const num = parseFloat(val);
          return { ...item, value: isNaN(num) ? 0 : num };
        }
        return { ...item, name: val };
      }
      return item;
    });
    onChangeData(updated);
  };

  // Add Row
  const handleAddRow = () => {
    const newItem: DataItem = {
      id: Date.now().toString(),
      name: `Category ${data.length + 1}`,
      value: Math.floor(Math.random() * 50) + 10
    };
    onChangeData([...data, newItem]);
  };

  // Delete Row
  const handleDeleteRow = (id: string) => {
    if (data.length <= 1) return;
    onChangeData(data.filter((item) => item.id !== id));
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvString = Papa.unparse(data.map((item) => ({ Label: item.name, Value: item.value })));
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(title || 'chart-data').toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  // Handle Raw Paste Parse
  const handleParsePaste = () => {
    if (!pasteContent.trim()) return;
    
    const parsed = Papa.parse<string[]>(pasteContent.trim(), { skipEmptyLines: true });
    if (parsed.data && parsed.data.length > 0) {
      const rows = parsed.data;
      const newData: DataItem[] = [];

      rows.forEach((row, idx) => {
        if (row.length >= 2) {
          const label = row[0].trim();
          const rawVal = row[1].trim().replace(/[^0-9.-]+/g, '');
          const val = parseFloat(rawVal);
          if (label && !isNaN(val)) {
            newData.push({
              id: `${Date.now()}-${idx}`,
              name: label,
              value: val
            });
          }
        }
      });

      if (newData.length > 0) {
        onChangeData(newData);
        setActiveTab('table');
        setPasteContent('');
      }
    }
  };

  // Handle AI Prompt Simulation
  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);

    setTimeout(() => {
      const promptLower = aiPrompt.toLowerCase();
      let generatedTitle = 'AI Generated Insights';
      let generatedData: DataItem[] = [];

      if (promptLower.includes('browser') || promptLower.includes('web')) {
        generatedTitle = 'Global Web Browser Share 2026';
        generatedData = [
          { id: '1', name: 'Chrome', value: 65.2 },
          { id: '2', name: 'Safari', value: 18.5 },
          { id: '3', name: 'Edge', value: 5.1 },
          { id: '4', name: 'Firefox', value: 3.4 },
          { id: '5', name: 'Opera', value: 2.8 }
        ];
      } else if (promptLower.includes('food') || promptLower.includes('diet') || promptLower.includes('calorie')) {
        generatedTitle = 'Daily Calorie Macro Breakdown';
        generatedData = [
          { id: '1', name: 'Carbohydrates', value: 45 },
          { id: '2', name: 'Proteins', value: 30 },
          { id: '3', name: 'Fats', value: 25 }
        ];
      } else if (promptLower.includes('crypto') || promptLower.includes('bitcoin')) {
        generatedTitle = 'DeFi & Crypto Asset Allocation';
        generatedData = [
          { id: '1', name: 'Bitcoin (BTC)', value: 45 },
          { id: '2', name: 'Ethereum (ETH)', value: 30 },
          { id: '3', name: 'Solana (SOL)', value: 15 },
          { id: '4', name: 'Stablecoins', value: 10 }
        ];
      } else {
        generatedTitle = aiPrompt.charAt(0).toUpperCase() + aiPrompt.slice(1);
        generatedData = [
          { id: '1', name: 'Primary Segment', value: 42 },
          { id: '2', name: 'Secondary Segment', value: 28 },
          { id: '3', name: 'Tertiary Segment', value: 18 },
          { id: '4', name: 'Other Factors', value: 12 }
        ];
      }

      onChangeTitle(generatedTitle);
      onChangeData(generatedData);
      setIsAiLoading(false);
      setActiveTab('table');
    }, 500);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Chart Title Inputs */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Chart Title & Subtitle
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Enter Chart Title..."
          className="input-glass"
          style={{ marginTop: '6px', fontWeight: 700, fontSize: '1rem' }}
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onChangeSubtitle(e.target.value)}
          placeholder="Enter Subtitle or Data Source..."
          className="input-glass"
          style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <FileSpreadsheet size={14} /> Data Table
        </button>
        <button
          className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
          onClick={() => setActiveTab('paste')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Clipboard size={14} /> Paste CSV
        </button>
        <button
          className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Wand2 size={14} /> AI Prompt
        </button>
      </div>

      {/* Tab 1: Live Spreadsheet Table */}
      {activeTab === 'table' && (
        <div className="animate-fade">
          <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Label</th>
                  <th style={{ padding: '8px 4px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', width: '90px' }}>Value</th>
                  <th style={{ padding: '8px 4px', width: '36px' }}></th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="input-glass"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td style={{ padding: '4px' }}>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                        className="input-glass"
                        style={{ padding: '6px 10px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                      />
                    </td>
                    <td style={{ padding: '4px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteRow(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                        title="Delete Row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleAddRow}
              className="btn-secondary"
              style={{ justifyContent: 'center', fontSize: '0.82rem' }}
            >
              <Plus size={14} /> Add Row
            </button>
            <button
              onClick={handleDownloadCsv}
              className="btn-secondary"
              style={{ justifyContent: 'center', fontSize: '0.82rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            >
              <Download size={14} /> Download CSV
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Clipboard Paste */}
      {activeTab === 'paste' && (
        <div className="animate-fade">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Paste raw lines from Excel, Sheets, or CSV (format: <code>Label, Value</code>):
          </p>
          <textarea
            rows={6}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Chrome, 65.2&#10;Safari, 18.5&#10;Edge, 5.1&#10;Firefox, 3.4"
            className="input-glass"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', resize: 'vertical' }}
          />
          <button
            onClick={handleParsePaste}
            className="btn-primary"
            style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
          >
            Parse & Update Chart
          </button>
        </div>
      )}

      {/* Tab 3: AI Prompt Generator */}
      {activeTab === 'ai' && (
        <div className="animate-fade">
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Type what you want to chart using natural language:
          </p>
          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Create a pie chart comparing browser market share in 2026..."
            className="input-glass"
            style={{ fontSize: '0.85rem', resize: 'none' }}
          />
          <button
            onClick={handleAiGenerate}
            disabled={isAiLoading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '12px', justifyContent: 'center', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
          >
            <Wand2 size={16} /> {isAiLoading ? 'Generating Chart Data...' : 'Generate with AI'}
          </button>
        </div>
      )}
    </div>
  );
};
