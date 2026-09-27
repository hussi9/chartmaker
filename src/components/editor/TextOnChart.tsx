import { useDoc } from '../../store/document';

export function TextOnChart(): React.JSX.Element {
  const text = useDoc((s) => s.spec.text);
  const setSpec = useDoc((s) => s.setSpec);
  return (
    <section className="cg-cell cg-text-on-chart" aria-label="Text on chart">
      <span className="cg-lbl">Text on chart</span>
      <input className="cg-input" aria-label="Title" placeholder="Title" value={text.title} onChange={(e) => setSpec((d) => { d.text.title = e.target.value; })} maxLength={200} />
      <input className="cg-input" aria-label="Subtitle" placeholder="Subtitle (optional)" value={text.subtitle ?? ''} onChange={(e) => setSpec((d) => { d.text.subtitle = e.target.value || undefined; })} maxLength={200} />
      <input className="cg-input" aria-label="Source" placeholder="Source, e.g. Statista" value={text.source ?? ''} onChange={(e) => setSpec((d) => { d.text.source = e.target.value || undefined; })} maxLength={120} />
    </section>
  );
}
