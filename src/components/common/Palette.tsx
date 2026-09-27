import { PALETTES, type Palette as PaletteT } from '../../chart/types';

export interface PaletteProps { value: string[]; onChange: (colors: string[]) => void; extra?: PaletteT[] }

function same(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((c, i) => c.toLowerCase() === b[i].toLowerCase());
}

export function PaletteRow({ value, onChange, extra = [] }: PaletteProps): React.JSX.Element {
  const all = [...extra, ...PALETTES];
  return (
    <div className="cg-palettes" role="group" aria-label="Palette">
      {all.map((p) => (
        <button key={p.id} type="button" className="cg-palette" data-on={same(value, p.colors) ? 'true' : undefined} aria-pressed={same(value, p.colors)} aria-label={`Palette ${p.name}`} title={p.name} onClick={() => onChange([...p.colors])}>
          {p.colors.slice(0, 4).map((c, i) => <span key={i} style={{ background: c }} />)}
        </button>
      ))}
    </div>
  );
}
