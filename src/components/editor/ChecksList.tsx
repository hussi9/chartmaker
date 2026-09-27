import type { Check } from '../../chart/checks';

export function ChecksList({ results }: { results: Check[] }): React.JSX.Element {
  return (
    <div className="cg-cell cg-checks">
      <span className="cg-lbl">Checks</span>
      <ul className="cg-checks-list" aria-label="Post-ready checks">
        {results.map((c) => (
          <li key={c.id} className="cg-check" data-pass={c.pass ? 'true' : 'false'}>
            <span className="cg-check-mark" aria-hidden="true">{c.pass ? '✓' : '✗'}</span>
            <span className="cg-check-text"><span className="cg-check-name">{label(c.id)}</span> · {c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function label(id: Check['id']): string {
  return id === 'data' ? 'Data' : id === 'contrast' ? 'Label contrast' : id === 'textSize' ? 'Text size' : id === 'cropZone' ? 'Crop zones' : 'Alt text';
}
