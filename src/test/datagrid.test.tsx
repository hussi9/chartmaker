import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataGrid } from '@/components/editor/DataGrid';
import { TextOnChart } from '@/components/editor/TextOnChart';
import { useDoc } from '@/store/document';
import { useUi } from '@/store/ui';
import { defaultSpec, type Row } from '@/chart/types';

beforeEach(() => {
  useUi.setState({ storage: 'unavailable' });
  useDoc.getState().reset();
  useDoc.getState().newDoc();
  useDoc.temporal.getState().clear();
});

const rows = () => useDoc.getState().spec.data;
const labelInputs = () => screen.getAllByRole('textbox', { name: /label/i });
const valueInputs = () => screen.getAllByRole('textbox', { name: /value/i });

describe('DataGrid', () => {
  it('renders one editable row per data row plus a trailing empty row', () => {
    render(<DataGrid />);
    expect(labelInputs()).toHaveLength(5);
    expect(labelInputs()[4]).toHaveAttribute('placeholder', 'Type a label…');
    expect(screen.getByText(/Total 134/)).toBeInTheDocument();
    expect(screen.getByText(/avg 33.5/)).toBeInTheDocument();
  });

  it('typing into the trailing row appends a row', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.type(labelInputs()[4], 'France');
    expect(rows()).toHaveLength(5);
    expect(rows()[4].label).toBe('France');
    expect(labelInputs()).toHaveLength(6);
  });

  it('Enter adds a row after the current one and focuses its label', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.click(valueInputs()[1]);
    await user.keyboard('{Enter}');
    expect(rows()).toHaveLength(5);
    expect(rows()[2].label).toBe('');
    expect(document.activeElement).toBe(labelInputs()[2]);
  });

  it('Backspace on an empty label row removes it (undoably)', async () => {
    const user = userEvent.setup();
    useDoc.getState().setRows([...rows(), { id: 'e', label: '', value: 0 }]);
    render(<DataGrid />);
    await user.click(labelInputs()[4]);
    await user.keyboard('{Backspace}');
    expect(rows()).toHaveLength(4);
    useDoc.temporal.getState().undo();
    expect(rows()).toHaveLength(5);
  });

  it('parses "12k", "$3" and "-4" on blur and stores the unit', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.clear(valueInputs()[0]);
    await user.type(valueInputs()[0], '12k');
    await user.tab();
    expect(rows()[0]).toMatchObject({ value: 12000, unit: 'compact' });
    await user.clear(valueInputs()[1]);
    await user.type(valueInputs()[1], '$3');
    await user.tab();
    expect(rows()[1]).toMatchObject({ value: 3, unit: 'currency' });
    await user.clear(valueInputs()[2]);
    await user.type(valueInputs()[2], '-4');
    await user.tab();
    expect(rows()[2].value).toBe(-4);
  });

  it('⌘D duplicates the row, ⌘↑ moves it up', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.click(labelInputs()[1]);
    await user.keyboard('{Meta>}d{/Meta}');
    expect(rows().map((r) => r.label)).toEqual(['USA', 'Italy', 'Italy', 'UK', 'Ireland']);
    // focus followed the duplicate (row 3); two moves up put it first
    await user.keyboard('{Meta>}{ArrowUp}{/Meta}');
    await user.keyboard('{Meta>}{ArrowUp}{/Meta}');
    expect(rows().map((r) => r.label)).toEqual(['Italy', 'USA', 'Italy', 'UK', 'Ireland']);
  });

  it('pasting multiple lines into a label cell fills rows', () => {
    render(<DataGrid />);
    const target = labelInputs()[4];
    fireEvent.paste(target, { clipboardData: { getData: () => 'France 30\nSpain 22\nPortugal 9' } });
    expect(rows().map((r) => r.label)).toEqual(['USA', 'Italy', 'UK', 'Ireland', 'France', 'Spain', 'Portugal']);
    expect(rows()[6].value).toBe(9);
  });

  it('Sort orders rows descending then ascending', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.click(screen.getByRole('button', { name: /sort/i }));
    expect(rows().map((r) => r.value)).toEqual([87, 20, 15, 12]);
    await user.click(screen.getByRole('button', { name: /sort/i }));
    expect(rows().map((r) => r.value)).toEqual([12, 15, 20, 87]);
  });

  it('"% of total" converts values to shares of 100', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.click(screen.getByRole('button', { name: /% of total/i }));
    expect(rows().map((r) => r.value)).toEqual([64.9, 14.9, 9, 11.2]);
    expect(rows()[0].unit).toBe('percent');
  });

  it('the units control applies a unit to every row', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    await user.click(screen.getByRole('radio', { name: '$' }));
    expect(rows().every((r) => r.unit === 'currency')).toBe(true);
  });

  it('Import menu offers Paste text, CSV file and Sample data', async () => {
    const user = userEvent.setup();
    useDoc.getState().setRows([{ id: 'x', label: 'Only', value: 1 }]);
    render(<DataGrid />);
    await user.click(screen.getByRole('button', { name: /import/i }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: /paste text/i })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: /csv file/i })).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: /sample data/i }));
    expect(rows().map((r) => r.label)).toEqual(['USA', 'Italy', 'UK', 'Ireland']);
  });

  it('windows long lists: 400 rows render far fewer inputs', () => {
    const many: Row[] = Array.from({ length: 400 }, (_, i) => ({ id: `r${i}`, label: `Row ${i}`, value: i }));
    useDoc.getState().setRows(many);
    render(<DataGrid />);
    expect(labelInputs().length).toBeLessThanOrEqual(120);
    expect(screen.getByText(/400 rows/)).toBeInTheDocument();
  });

  it('colour dot cycles the palette for that row', async () => {
    const user = userEvent.setup();
    render(<DataGrid />);
    const dots = screen.getAllByRole('button', { name: /colour/i });
    await user.click(dots[0]);
    expect(rows()[0].color).toBe(defaultSpec().palette[1]);
  });
});

describe('TextOnChart', () => {
  it('binds title, subtitle and source', async () => {
    const user = userEvent.setup();
    render(<TextOnChart />);
    await user.type(screen.getByRole('textbox', { name: /subtitle/i }), 'Stage drop-off');
    await user.type(screen.getByRole('textbox', { name: /source/i }), 'Statista');
    expect(useDoc.getState().spec.text).toMatchObject({ title: 'Countries', subtitle: 'Stage drop-off', source: 'Statista' });
  });
});
