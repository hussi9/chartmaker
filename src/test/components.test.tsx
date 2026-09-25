import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../components/Toast';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Header } from '../components/Header';
import { ChartTypeBar } from '../components/ChartTypeBar';
import type { ToastMessage } from '../components/Toast';

describe('UI Component Test Suite', () => {
  describe('ToastContainer Component', () => {
    it('renders nothing when toasts array is empty', () => {
      const { container } = render(<ToastContainer toasts={[]} onDismiss={() => {}} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders toast messages with correct text and calls onDismiss when clicked', () => {
      const handleDismiss = vi.fn();
      const toasts: ToastMessage[] = [
        { id: 't1', text: 'Saved to library!', type: 'success' },
        { id: 't2', text: 'Viral link ready!', type: 'viral' }
      ];

      render(<ToastContainer toasts={toasts} onDismiss={handleDismiss} />);

      expect(screen.getByText('Saved to library!')).toBeInTheDocument();
      expect(screen.getByText('Viral link ready!')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Saved to library!'));
      expect(handleDismiss).toHaveBeenCalledWith('t1');
    });
  });

  describe('MobileBottomNav Component', () => {
    it('renders all mobile action buttons and highlights active tab', () => {
      const handleChangeTab = vi.fn();
      const handleOpenTemplates = vi.fn();
      const handleOpenSaved = vi.fn();

      render(
        <MobileBottomNav
          currentTab="canvas"
          onChangeTab={handleChangeTab}
          onOpenTemplates={handleOpenTemplates}
          onOpenSaved={handleOpenSaved}
          savedCount={3}
        />
      );

      expect(screen.getByText('Canvas')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();

      // Check badge count
      expect(screen.getByText('3')).toBeInTheDocument();

      // Click data tab
      fireEvent.click(screen.getByText('Data'));
      expect(handleChangeTab).toHaveBeenCalledWith('data');

      // Click templates
      fireEvent.click(screen.getByText('Templates'));
      expect(handleOpenTemplates).toHaveBeenCalled();

      // Click saved
      fireEvent.click(screen.getByText('Saved'));
      expect(handleOpenSaved).toHaveBeenCalled();
    });
  });

  describe('Header Component', () => {
    const mockChartState = {
      title: 'Monthly Revenue',
      subtitle: 'Q3 2026',
      chartType: 'bar' as const,
      schemeId: 'spotify',
      data: [{ id: '1', name: 'Sales', value: 100 }]
    };

    it('renders brand title and action triggers', () => {
      const handleOpenAi = vi.fn();
      const handleOpenTemplates = vi.fn();
      const handleOpenExport = vi.fn();
      const handleOpenSaved = vi.fn();
      const handleQuickSave = vi.fn();

      render(
        <Header
          onOpenAiPrompt={handleOpenAi}
          onOpenTemplates={handleOpenTemplates}
          onOpenExport={handleOpenExport}
          onOpenSaved={handleOpenSaved}
          onQuickSave={handleQuickSave}
          savedCount={2}
          chartState={mockChartState}
        />
      );

      expect(screen.getByText('ChartGenie')).toBeInTheDocument();
      expect(screen.getByText('.xyz')).toBeInTheDocument();

      // AI Prompt button
      const aiBtn = screen.getByRole('button', { name: /ai prompt/i });
      expect(aiBtn).toBeInTheDocument();
      fireEvent.click(aiBtn);
      expect(handleOpenAi).toHaveBeenCalled();

      // Templates button
      const templatesBtn = screen.getByRole('button', { name: /templates/i });
      expect(templatesBtn).toBeInTheDocument();
      fireEvent.click(templatesBtn);
      expect(handleOpenTemplates).toHaveBeenCalled();

      // Export button
      const exportBtn = screen.getByRole('button', { name: /export/i });
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);
      expect(handleOpenExport).toHaveBeenCalled();

      // Quick Save button
      const saveBtn = screen.getByRole('button', { name: /save/i });
      expect(saveBtn).toBeInTheDocument();
      fireEvent.click(saveBtn);
      expect(handleQuickSave).toHaveBeenCalled();
    });
  });

  describe('ChartTypeBar Component (17 Chart Offerings)', () => {
    it('renders primary types and expands more dropdown with categories and options', () => {
      const handleSelectType = vi.fn();

      render(
        <ChartTypeBar
          activeType="bar"
          onSelectType={handleSelectType}
        />
      );

      // Verify primary types are rendered
      expect(screen.getByText('Bar')).toBeInTheDocument();
      expect(screen.getByText('Line')).toBeInTheDocument();
      expect(screen.getByText('Pie')).toBeInTheDocument();
      expect(screen.getByText('Donut')).toBeInTheDocument();
      expect(screen.getByText('Area')).toBeInTheDocument();

      // Click More to open dropdown
      const moreBtn = screen.getByRole('button', { name: /more/i });
      expect(moreBtn).toBeInTheDocument();
      fireEvent.click(moreBtn);

      // Verify category headers are present
      expect(screen.getByText('Bars & Columns')).toBeInTheDocument();
      expect(screen.getByText('Lines & Trends')).toBeInTheDocument();
      expect(screen.getByText('Distribution & Matrix')).toBeInTheDocument();
      expect(screen.getByText('KPIs & Funnels')).toBeInTheDocument();

      // Verify specific specialized chart types exist
      expect(screen.getByText('Rule Chart (Average)')).toBeInTheDocument();
      expect(screen.getByText('Heat Map Matrix')).toBeInTheDocument();
      expect(screen.getByText('Gauge / Meter')).toBeInTheDocument();
      expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();

      // Select Heat Map
      fireEvent.click(screen.getByText('Heat Map Matrix'));
      expect(handleSelectType).toHaveBeenCalledWith('heatmap');
    });
  });
});
