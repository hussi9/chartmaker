import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from '../App';

describe('save feedback', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('shows failure guidance and no success when a chart cannot persist', () => {
    const originalSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'chartgenie_saved_charts_v1') throw new Error('quota');
      return originalSet.call(this, key, value);
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByText(/could not save.*backup|storage.*unavailable/i)).toBeTruthy();
    expect(screen.queryByText(/saved to My Charts/i)).toBeNull();
  });
});
