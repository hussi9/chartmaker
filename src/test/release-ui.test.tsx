import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AiPromptModal } from '../components/AiPromptModal';
import { ExportModal } from '../components/ExportModal';
import { SeoAeoSection } from '../components/SeoAeoSection';

describe('trust copy and parser confirmation', () => {
  it('shows parsed rows for confirmation before changing the chart', () => {
    const apply = vi.fn();
    render(<AiPromptModal isOpen onClose={() => {}} onApplyPrompt={apply} />);
    expect(screen.getByText(/Smart Parser/i)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(/iPhone:/i), { target: { value: 'Traffic: Organic 4200, Social 1800' } });
    fireEvent.click(screen.getByRole('button', { name: /preview rows/i }));
    expect(within(screen.getByRole('status')).getByText(/Organic.*4200/i)).toBeTruthy();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /use these rows/i }));
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ name: 'Organic', value: 4200 })]) }));
  });

  it('does not offer an iframe or unsupported DPI claim in export', () => {
    render(<ExportModal isOpen onClose={() => {}} canvasRef={{ current: null }} chartTitle="Test" />);
    expect(screen.queryByText(/iframe|300 DPI|4K PNG/i)).toBeNull();
    expect(screen.getByText(/4x PNG/i)).toBeTruthy();
  });

  it('keeps unsupported ratings, embeds and privacy promises out of the information section', () => {
    const { container } = render(<SeoAeoSection />);
    expect(container.textContent).not.toMatch(/aggregateRating|reviewCount|iframe|300 DPI|lossless|never leaves your browser|AI Prompt/i);
  });
});
