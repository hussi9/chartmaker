import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { AiPromptModal } from '../components/AiPromptModal';
import { ChartTypeBar } from '../components/ChartTypeBar';

describe('ChartGenie core editor accessibility', () => {
  it('names the chart fields and each data row input', () => {
    render(<App />);

    expect(screen.getByRole('textbox', { name: 'Chart title' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Data source' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Row 1 label' })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: 'Row 1 value' })).toBeTruthy();
  });

  it('moves focus into the data editor from the mobile preview shortcut', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit data' }));

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Row 1 label' }));
  });

  it('exposes the selected chart type to keyboard and assistive technology users', () => {
    render(<ChartTypeBar activeType="line" onSelectType={() => {}} />);

    expect(screen.getByRole('button', { name: 'Line' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Bar' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('places the primary export action first in the header action order', () => {
    render(<App />);

    const headerButtons = within(screen.getByRole('banner')).getAllByRole('button');
    expect(headerButtons[0].textContent).toMatch(/export/i);
  });

  it('names row actions by their affected row', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Move row 1 down' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Duplicate row 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove row 1' })).toBeTruthy();
  });

  it('returns from data editing to the preview or chart choices with focus', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit data' }));
    fireEvent.click(screen.getByRole('button', { name: 'View preview' }));
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Chart preview' }));

    const activeChart = screen.getByRole('button', { name: 'Line' });
    const revealActiveChart = vi.fn();
    activeChart.scrollIntoView = revealActiveChart;
    fireEvent.click(screen.getByRole('button', { name: 'Choose chart type' }));
    expect(document.activeElement).toBe(activeChart);
    expect(revealActiveChart).toHaveBeenCalled();
  });
});

describe('Smart Parser recovery', () => {
  it('explains an unparsed input and prevents applying an empty preview', () => {
    const apply = vi.fn();
    render(<AiPromptModal isOpen onClose={() => {}} onApplyPrompt={apply} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'words without numbers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview rows' }));

    expect(screen.getByRole('status').textContent).toMatch(/no values found/i);
    expect(screen.queryByRole('button', { name: 'Use these rows' })).toBeNull();
    expect(apply).not.toHaveBeenCalled();
  });
});
