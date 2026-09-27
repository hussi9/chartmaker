import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InsightsPanel } from '@/components/editor/InsightsPanel';
import { CaptionPanel } from '@/components/editor/CaptionPanel';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';

beforeEach(() => {
  useUi.setState({ storage: 'unavailable', tone: 'punchy' });
  useDoc.getState().reset();
  useDoc.getState().newDoc();
  useDoc.temporal.getState().clear();
});

afterEach(() => { delete (globalThis as { LanguageModel?: unknown }).LanguageModel; });

describe('InsightsPanel', () => {
  it('lists the computed facts as chips with "+ add"', () => {
    render(<InsightsPanel />);
    const list = screen.getByRole('list', { name: /insights/i });
    const items = within(list).getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(list).toHaveTextContent('USA is 4.4× the next value');
    expect(within(items[0]).getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('adding a chip creates a callout anchored to the row; adding again removes it', async () => {
    const user = userEvent.setup();
    render(<InsightsPanel />);
    const chip = screen.getByRole('button', { name: /add USA is 4.4× the next value/i });
    await user.click(chip);
    const callouts = useDoc.getState().spec.callouts;
    expect(callouts).toHaveLength(1);
    expect(callouts[0]).toMatchObject({ insightId: 'ratio', text: 'USA is 4.4× the next value', anchor: { rowId: 's1' } });
    expect(screen.getByRole('button', { name: /remove USA is 4.4×/i })).toHaveTextContent(/on chart/i);
    await user.click(screen.getByRole('button', { name: /remove USA is 4.4×/i }));
    expect(useDoc.getState().spec.callouts).toHaveLength(0);
    useDoc.temporal.getState().undo();
    expect(useDoc.getState().spec.callouts).toHaveLength(1);
  });

  it('an insight without a row (average) adds a callout anchored to the largest row', async () => {
    const user = userEvent.setup();
    render(<InsightsPanel />);
    await user.click(screen.getByRole('button', { name: /add Average is 33.5/i }));
    expect(useDoc.getState().spec.callouts[0].anchor.rowId).toBe('s1');
  });

  it('shows guidance when there are no rows', () => {
    useDoc.getState().setRows([]);
    render(<InsightsPanel />);
    expect(screen.getByText(/add some rows/i)).toBeInTheDocument();
  });
});

describe('CaptionPanel', () => {
  it('pre-fills the punchy caption and follows the tone', async () => {
    const user = userEvent.setup();
    render(<CaptionPanel />);
    const box = screen.getByRole('textbox', { name: /caption/i });
    expect(box).toHaveValue('One value carries it: USA at 87 is 4.4× the next, and 65% of everything. Where next?');
    await user.click(screen.getByRole('radio', { name: 'Plain' }));
    expect(box).toHaveValue('Countries: USA leads at 87, 65% of the total.');
    expect(useDoc.getState().spec.caption).toMatchObject({ tone: 'plain', edited: false });
  });

  it('keeps a hand-edited caption when the tone changes, until reset', async () => {
    const user = userEvent.setup();
    render(<CaptionPanel />);
    const box = screen.getByRole('textbox', { name: /caption/i });
    await user.clear(box);
    await user.type(box, 'My own words.');
    expect(useDoc.getState().spec.caption).toMatchObject({ text: 'My own words.', edited: true });
    await user.click(screen.getByRole('radio', { name: 'Analyst' }));
    expect(box).toHaveValue('My own words.');
    await user.click(screen.getByRole('button', { name: /reset to draft/i }));
    expect(box).toHaveValue('USA accounts for 65% of the 134 total; the next largest, Italy, trails at 4.4× less.');
  });

  it('follows the data when not edited', async () => {
    render(<CaptionPanel />);
    useDoc.getState().setSpec((d) => { d.data[0].value = 200; });
    await waitFor(() => expect((screen.getByRole('textbox', { name: /caption/i }) as HTMLTextAreaElement).value).toContain('200'));
  });

  it('Copy puts the caption on the clipboard', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<CaptionPanel />);
    await user.click(screen.getByRole('button', { name: /copy caption/i }));
    expect(write).toHaveBeenCalledWith(expect.stringContaining('USA'));
    write.mockRestore();
  });

  it('hashtags are off by default and append derived tags when toggled', async () => {
    const user = userEvent.setup();
    render(<CaptionPanel />);
    const box = screen.getByRole('textbox', { name: /caption/i });
    expect((box as HTMLTextAreaElement).value).not.toContain('#');
    await user.click(screen.getByRole('button', { name: /hashtags/i }));
    expect((box as HTMLTextAreaElement).value).toMatch(/#countries/i);
  });

  it('shows Regenerate only when a built-in model exists and uses its text', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CaptionPanel />);
    expect(screen.queryByRole('button', { name: /regenerate/i })).toBeNull();
    unmount();
    (globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn().mockResolvedValue('available'),
      create: vi.fn().mockResolvedValue({ prompt: vi.fn().mockResolvedValue('Stub caption from the device model.'), destroy: vi.fn() }),
    };
    render(<CaptionPanel />);
    await user.click(screen.getByRole('button', { name: /regenerate/i }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: /caption/i })).toHaveValue('Stub caption from the device model.'));
  });
});
