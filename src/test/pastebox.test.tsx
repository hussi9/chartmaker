import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasteBox } from '@/components/intake/PasteBox';
import { detect } from '@/insights/intake';

const baseProps = {
  text: '', onText: vi.fn(), detection: detect(''), unit: 'number' as const, onUnit: vi.fn(),
};

describe('PasteBox picture chip', () => {
  it('shows a Picture chip alongside Cells, Sentence and CSV', () => {
    render(<PasteBox {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Picture' })).toBeInTheDocument();
  });

  it('clicking Picture opens a hidden image file input', () => {
    render(<PasteBox {...baseProps} />);
    const input = screen.getByLabelText('Picture file') as HTMLInputElement;
    expect(input.accept).toBe('image/*');
    // jsdom sets the HTML attribute but doesn't reflect it as a JS property (jsdom#3739-class gap) — assert the attribute a real browser reads.
    expect(input.getAttribute('capture')).toBe('environment');
  });

  it('picking a file calls onImage with that file', () => {
    const onImage = vi.fn();
    render(<PasteBox {...baseProps} onImage={onImage} />);
    const input = screen.getByLabelText('Picture file') as HTMLInputElement;
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImage).toHaveBeenCalledWith(file);
  });

  it('dropping an image file calls onImage (Review Focus 4: non-image drop is ignored, not crashed)', () => {
    const onImage = vi.fn();
    const onText = vi.fn();
    const { container } = render(<PasteBox {...baseProps} onImage={onImage} onText={onText} />);
    const box = container.querySelector('.cg-pastebox')!;
    const imageFile = new File(['x'], 'photo.png', { type: 'image/png' });
    fireEvent.drop(box, { dataTransfer: { files: [imageFile], getData: () => '' } });
    expect(onImage).toHaveBeenCalledWith(imageFile);

    onImage.mockClear();
    const videoFile = new File(['x'], 'clip.mov', { type: 'video/quicktime' });
    fireEvent.drop(box, { dataTransfer: { files: [videoFile], getData: () => '' } });
    expect(onImage).not.toHaveBeenCalled();
  });

  it('shows a loading-engine message, a reading message, and a warning by state', () => {
    const { rerender } = render(<PasteBox {...baseProps} imageState="loading-engine" />);
    expect(screen.getByText(/setting up picture reading/i)).toBeInTheDocument();
    rerender(<PasteBox {...baseProps} imageState="reading" />);
    expect(screen.getByText(/reading your picture/i)).toBeInTheDocument();
    rerender(<PasteBox {...baseProps} imageWarning="Couldn't find a clear table in that picture." />);
    expect(screen.getByText(/couldn.t find a clear table/i)).toBeInTheDocument();
  });

  it('shows a thumbnail next to the detected rows when the caller supplies one (owned by useIntake — review item I4)', () => {
    render(<PasteBox {...baseProps} thumbUrl="blob:fake-url" />);
    expect(screen.getByAltText('Picture you added')).toBeInTheDocument();
  });

  it('shows no thumbnail when the caller has none yet', () => {
    render(<PasteBox {...baseProps} />);
    expect(screen.queryByAltText('Picture you added')).toBeNull();
  });
});
