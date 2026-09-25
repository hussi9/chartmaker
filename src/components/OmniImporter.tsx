import React, { useState, useRef } from 'react';
import { Clipboard, Plus, Trash2, Wand2, FileSpreadsheet, Download, Upload, ArrowUpDown, Shuffle, RotateCcw, Sparkles, Smile, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import type { DataItem, ChartType } from '../lib/chartPresets';
import { parseNaturalLanguagePrompt } from '../lib/aiParser';
import { decorateItemWithEmoji } from '../lib/emojiDecorator';
import { triggerHaptic } from '../lib/haptics';
import Papa from 'papaparse';

interface OmniImporterProps {
  data: DataItem[];
  onChangeData: (newData: DataItem[]) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  subtitle: string;
  onChangeSubtitle: (subtitle: string) => void;
  onAutoSelectChartType?: (type: ChartType) => void;
  onNotify?: (text: string, type?: 'success' | 'info' | 'viral') => void;
}

export const OmniImporter: React.FC<OmniImporterProps> = ({
  data,
  onChangeData,
  title,
  onChangeTitle,
  subtitle,
  onChangeSubtitle,
  onAutoSelectChartType,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'paste' | 'ai'>('table');
  const [pasteContent, setPasteContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Quick Stats
  const total = data.reduce((acc, curr) => acc + (typeof curr.value === 'number' ? curr.value : 0), 0);
  const avg = data.length > 0 ? (total / data.length).toFixed(1) : '0';

  // Handle cell edit
  const handleUpdateItem = (id: string, field: 'name' | 'value' | 'color', val: string) => {
    const updated = data.map((item) => {
      if (item.id === id) {
        if (field === 'value') {
          const num = parseFloat(val);
          return { ...item, value: isNaN(num) ? 0 : num };
        }
        if (field === 'color') {
          return { ...item, color: val };
        }
        return { ...item, name: val };
      }
      return item;
    });
    onChangeData(updated);
  };

  // Add Row
  const handleAddRow = () => {
    triggerHaptic('light');
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
    triggerHaptic('light');
    onChangeData(data.filter((item) => item.id !== id));
  };

  // Sort Data
  const handleSort = (direction: 'desc' | 'asc') => {
    triggerHaptic('light');
    const sorted = [...data].sort((a, b) => direction === 'desc' ? b.value - a.value : a.value - b.value);
    onChangeData(sorted);
    onNotify?.(`Sorted ${direction === 'desc' ? 'Highest to Lowest' : 'Lowest to Highest'}`, 'info');
  };

  // Randomize / Mock Data
  const handleRandomize = () => {
    triggerHaptic('light');
    const randomized = data.map(item => ({
      ...item,
      value: Math.floor(Math.random() * 90) + 10
    }));
    onChangeData(randomized);
    onNotify?.('Generated randomized test values', 'info');
  };

  // Reset to default sample
  const handleReset = () => {
    triggerHaptic('medium');
    onChangeData([
      { id: '1', name: 'Segment A', value: 40 },
      { id: '2', name: 'Segment B', value: 30 },
      { id: '3', name: 'Segment C', value: 20 },
      { id: '4', name: 'Segment D', value: 10 }
    ]);
    onChangeTitle('Sample Distribution');
    onChangeSubtitle('Overview Metrics');
    onNotify?.('Reset chart to starter template', 'info');
  };

  // Auto-apply viral emojis to labels
  const handleApplyEmojis = () => {
    triggerHaptic('success');
    const updated = data.map(item => ({
      ...item,
      name: decorateItemWithEmoji(item.name)
    }));
    onChangeData(updated);
    onNotify?.('Enhanced labels with matching emojis! 🎉', 'viral');
  };

  // Move row up / down
  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    triggerHaptic('light');
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.length) return;
    const newData = [...data];
    const [moved] = newData.splice(index, 1);
    newData.splice(targetIndex, 0, moved);
    onChangeData(newData);
  };

  // Duplicate row
  const handleDuplicateRow = (id: string) => {
    triggerHaptic('light');
    const index = data.findIndex(i => i.id === id);
    if (index === -1) return;
    const item = data[index];
    const copy: DataItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${item.name} (Copy)`
    };
    const newData = [...data];
    newData.splice(index + 1, 0, copy);
    onChangeData(newData);
    onNotify?.('Duplicated row', 'info');
  };

  // Download CSV
  const handleDownloadCsv = () => {
    triggerHaptic('light');
    const csvString = Papa.unparse(data.map((item) => ({ Label: item.name, Value: item.value })));
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(title || 'chart-data').toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    onNotify?.('CSV file downloaded', 'success');
  };

  // Process File CSV
  const processCsvFile = (file: File) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const rows = results.data;
          const startIndex = isNaN(parseFloat(rows[0][1])) ? 1 : 0;
          const parsedData: DataItem[] = [];

          for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 2) {
              const label = row[0]?.trim();
              const num = parseFloat(row[1]?.trim().replace(/[^0-9.-]+/g, ''));
              if (label && !isNaN(num)) {
                parsedData.push({
                  id: `${Date.now()}-${i}`,
                  name: label,
                  value: num
                });
              }
            }
          }

          if (parsedData.length > 0) {
            onChangeData(parsedData);
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            onChangeTitle(fileNameWithoutExt.charAt(0).toUpperCase() + fileNameWithoutExt.slice(1));
            onChangeSubtitle(`Imported from ${file.name}`);
            setActiveTab('table');
            triggerHaptic('success');
            onNotify?.(`Imported ${parsedData.length} rows from CSV!`, 'viral');
          } else {
            onNotify?.('No valid numeric columns found in CSV', 'info');
          }
        }
      }
    });
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Raw Paste Parse
  const handleParsePaste = () => {
    if (!pasteContent.trim()) return;
    triggerHaptic('light');

    const parsed = Papa.parse<string[]>(pasteContent.trim(), { skipEmptyLines: true });
    if (parsed.data && parsed.data.length > 0) {
      const rows = parsed.data;
      const startIndex = isNaN(parseFloat(rows[0][1])) ? 1 : 0;
      const newData: DataItem[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 2) {
          const label = row[0]?.trim();
          const rawVal = row[1]?.trim().replace(/[^0-9.-]+/g, '');
          const val = parseFloat(rawVal);
          if (label && !isNaN(val)) {
            newData.push({
              id: `${Date.now()}-${i}`,
              name: label,
              value: val
            });
          }
        }
      }

      if (newData.length > 0) {
        onChangeData(newData);
        setActiveTab('table');
        setPasteContent('');
        triggerHaptic('success');
        onNotify?.(`Parsed ${newData.length} data rows!`, 'success');
      } else {
        onNotify?.('Could not parse rows. Check format: Label, Value', 'info');
      }
    }
  };

  // Handle AI Prompt Generation with NLP Engine
  const handleAiGenerate = (promptText?: string) => {
    const textToUse = promptText || aiPrompt;
    if (!textToUse.trim()) return;

    triggerHaptic('light');
    setIsAiLoading(true);

    setTimeout(() => {
      const result = parseNaturalLanguagePrompt(textToUse);
      onChangeTitle(result.title);
      onChangeSubtitle(result.subtitle);
      onChangeData(result.data);
      if (onAutoSelectChartType && result.recommendedType) {
        onAutoSelectChartType(result.recommendedType);
      }
      setIsAiLoading(false);
      setActiveTab('table');
      triggerHaptic('success');
      onNotify?.(`AI generated "${result.title}" chart!`, 'viral');
    }, 350);
  };

  const starterPrompts = [
    { label: '🧑‍💻 Dev Workday', prompt: 'Where developer 8 hour workday goes: Thinking 35%, Reading docs 25%, Slack meetings 20%, Coding 15%, Git conflicts 5%' },
    { label: '☕ Coffee Milligrams', prompt: 'Cold brew 180mg, Espresso double 150mg, Drip coffee 140mg, Energy drink 160mg, Matcha tea 70mg' },
    { label: '💰 Living Budget', prompt: 'Monthly budget breakdown: Rent $1400, Food & Dining $550, Transport $220, Savings $800, Fun $250' },
    { label: '🌐 Browser Share', prompt: 'Chrome 64.8, Safari 19.3, Edge 5.4, Firefox 3.2, Opera 2.7' }
  ];

  return (
    <div
      className="glass-panel"
      style={{ padding: '20px', position: 'relative' }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(99, 102, 241, 0.9)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          backdropFilter: 'blur(8px)',
          color: '#ffffff'
        }}>
          <Upload size={40} className="animate-bounce" />
          <p style={{ marginTop: '12px', fontWeight: 800, fontSize: '1.1rem' }}>Drop CSV File to Import</p>
        </div>
      )}

      {/* Chart Title Inputs */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            Chart Title & Subtitle
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              Sum: {total.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(165, 180, 252, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              Avg: {avg}
            </span>
          </div>
        </div>
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
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '8px' }}>
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => { triggerHaptic('light'); setActiveTab('table'); }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <FileSpreadsheet size={14} /> Data Table
        </button>
        <button
          className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
          onClick={() => { triggerHaptic('light'); setActiveTab('paste'); }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Clipboard size={14} /> Paste CSV
        </button>
        <button
          className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => { triggerHaptic('light'); setActiveTab('ai'); }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Wand2 size={14} /> Smart AI
        </button>
      </div>

      {/* Tab 1: Live Spreadsheet Table */}
      {activeTab === 'table' && (
        <div className="animate-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {data.length} metrics
            </span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={handleApplyEmojis}
                title="Auto-detect & prepend viral emojis to labels"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: '#38bdf8', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
              >
                <Smile size={11} color="#38bdf8" /> Auto Emojis
              </button>
              <button
                onClick={() => handleSort('desc')}
                title="Sort highest to lowest"
                style={{ background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-muted)', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <ArrowUpDown size={11} /> High-Low
              </button>
              <button
                onClick={handleRandomize}
                title="Randomize values for testing"
                style={{ background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-muted)', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <Shuffle size={11} /> Mock
              </button>
              <button
                onClick={handleReset}
                title="Reset to starter"
                style={{ background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-muted)', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '270px', overflowY: 'auto', paddingRight: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 4px', width: '28px' }}></th>
                  <th style={{ padding: '6px 4px', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Label</th>
                  <th style={{ padding: '6px 4px', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', width: '80px' }}>Value</th>
                  <th style={{ padding: '6px 4px', width: '74px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* Inline Color Dot Swatch */}
                    <td style={{ padding: '3px 2px', textAlign: 'center' }}>
                      <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }} title="Change slice color">
                        <span style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: item.color || '#6366f1',
                          border: '1px solid rgba(255,255,255,0.3)',
                          verticalAlign: 'middle'
                        }} />
                        <input
                          type="color"
                          value={item.color || '#6366f1'}
                          onChange={(e) => handleUpdateItem(item.id, 'color', e.target.value)}
                          style={{
                            opacity: 0,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                          }}
                        />
                      </label>
                    </td>

                    {/* Label Input */}
                    <td style={{ padding: '3px 4px' }}>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="input-glass"
                        style={{ padding: '5px 8px', fontSize: '0.82rem' }}
                      />
                    </td>

                    {/* Value Input */}
                    <td style={{ padding: '3px 4px' }}>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                        className="input-glass"
                        style={{ padding: '5px 8px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                      />
                    </td>

                    {/* Actions: Move Up, Move Down, Duplicate, Delete */}
                    <td style={{ padding: '3px 2px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => handleMoveRow(index, 'up')}
                        disabled={index === 0}
                        style={{ background: 'transparent', border: 'none', color: index === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: index === 0 ? 'default' : 'pointer', padding: '2px 3px' }}
                        title="Move Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMoveRow(index, 'down')}
                        disabled={index === data.length - 1}
                        style={{ background: 'transparent', border: 'none', color: index === data.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: index === data.length - 1 ? 'default' : 'pointer', padding: '2px 3px' }}
                        title="Move Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button
                        onClick={() => handleDuplicateRow(item.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 3px' }}
                        title="Duplicate Row"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(item.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 3px' }}
                        title="Delete Row"
                      >
                        <Trash2 size={12} />
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
              style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
            >
              <Plus size={14} /> Add Row
            </button>
            <button
              onClick={handleDownloadCsv}
              className="btn-secondary"
              style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Clipboard Paste & File Drop */}
      {activeTab === 'paste' && (
        <div className="animate-fade">
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Paste lines from Excel / Sheets, or drop a <code>.csv</code> file:
          </p>
          <textarea
            rows={5}
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Chrome, 65.2&#10;Safari, 18.5&#10;Edge, 5.1&#10;Firefox, 3.4"
            className="input-glass"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }}
          />

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) processCsvFile(e.target.files[0]);
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
              style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
            >
              <Upload size={14} /> Upload File
            </button>
            <button
              onClick={handleParsePaste}
              className="btn-primary"
              style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
            >
              Parse Data
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Smart AI Prompt Generator */}
      {activeTab === 'ai' && (
        <div className="animate-fade">
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Type any topic or paste unstructured text with numbers:
          </p>
          <textarea
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Compare Apple 3.4T, Microsoft 3.1T, Nvidia 3.2T, Alphabet 2.1T..."
            className="input-glass"
            style={{ fontSize: '0.84rem', resize: 'none' }}
          />

          {/* 1-Tap Starter Prompts */}
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Quick Starters:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {starterPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiPrompt(item.prompt);
                    handleAiGenerate(item.prompt);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <Sparkles size={11} color="#38bdf8" /> {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleAiGenerate()}
            disabled={isAiLoading}
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '4px',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              padding: '10px'
            }}
          >
            <Wand2 size={15} /> {isAiLoading ? 'Synthesizing Data...' : 'Generate with AI Engine'}
          </button>
        </div>
      )}
    </div>
  );
};
